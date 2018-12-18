import { ext } from './extensionVariables';
import { randomPoint } from './methods';
import { Bird } from './Bird';
import { Food } from './Food';
import { Pred } from './Pred';

const app = new PIXI.Application(window.innerWidth, window.innerHeight);
document.body.appendChild(app.view);
ext.app = app;
ext.died = 0;
ext.time = 0;
ext.food = 0;

app.ticker.speed = 2;
const BIRDS = 12;
const FOOD = 48;
const PRED = 3;

const minSpeed = 0;
const maxSpeed = 10;
const deltaSpeed = 0.25;

const background = PIXI.Sprite.fromImage('../pictures/background.jpg');
background.width = app.screen.width;
background.height = app.screen.height;
app.stage.addChild(background);

window.addEventListener('resize', onResize);
function onResize() {
    app.renderer.resize(window.innerWidth, window.innerHeight);
    background.width = app.screen.width;
    background.height = app.screen.height;
}

let paused = false;
window.setInterval(function () { deleting(); }, 5000 / app.ticker.speed);
window.setInterval(function () { mutation(); }, 7000 / app.ticker.speed);
window.setInterval(function () { cleaning(); }, 9000 / app.ticker.speed);
document.addEventListener('keydown', onKeyDown);
function onKeyDown(event) {
    if (event.keyCode == /* m */ 77) {
        mutation();
    } else if (event.keyCode == /* d */ 68) {
        deleting();
    } else if (event.keyCode == /* c */ 67) {
        cleaning();
    } else if (event.keyCode == /* p */ 80) {
        paused = !paused;
        if (paused) {
            app.stop();
        } else {
            app.start();
        }
    } else if (event.keyCode == /* left arrow */ 37) {
        if (app.ticker.speed - deltaSpeed >= minSpeed) {
            app.ticker.speed -= deltaSpeed;
        }
        showNotification(`Speed has decreased: ${app.ticker.speed}`);
    } else if (event.keyCode == /* right arrow */ 39) {
        if (app.ticker.speed + deltaSpeed <= maxSpeed) {
            app.ticker.speed += deltaSpeed;
        }
        showNotification(`Speed has increased: ${app.ticker.speed}`);
    }
}

let birds: Bird[] = []
let foods: Food[] = [];
let preds: Pred[] = [];

function createBird() {
    let info = new PIXI.Text('', small);
    info.visible = true;

    birds.sort(byResult);
    // let result = 0;
    // if (birds.length) {
    //     result = Math.floor(birds[Math.floor(birds.length / 2)].getResult() / 3);
    // }
    const createdBird = new Bird(0, 0, null, info, null);
    return createdBird;
}

function createFood(position?) {
    if (!position) {
        position = randomPoint();
    }
    const createdFood = new Food(position);
    return createdFood;
}

function createPred(position?) {
    let info = new PIXI.Text('', small);
    info.visible = true;

    if (!position) {
        position = randomPoint();
    }

    const createdPred = new Pred(info, position);

    app.stage.addChild(createdPred.sprite);
    app.stage.addChild(createdPred.info);
    return createdPred;
}

app.renderer.plugins.interaction.on('mousedown', createGhostAtPoint);
function createGhostAtPoint() {
    if (preds.length == PRED) {
        preds.shift().kill();
    }
    preds.push(createPred(app.renderer.plugins.interaction.mouse.global));
}

function gameSetup() {
    for (let i = 0; i < BIRDS; i++) {
        birds.push(createBird());
    }
    for (let i = 0; i < FOOD; i++) {
        foods.push(createFood());
    }
}
gameSetup();

let ate: number[] = [];
app.ticker.add(function (delta) {
    let foodsKilled = new Set<Food>();
    for (let i = 0; i < foods.length; i++) {

        const food = foods[i];
        let closestBird: Bird = null;
        for (let j = 0; j < birds.length; j++) {
            const bird = birds[j];
            if (food.distance(bird) < food.distance(closestBird)) {
                closestBird = bird;
            }
        }

        if (food.faced(closestBird)) {
            closestBird.success();
            foodsKilled.add(food);
        }
    }

    let birdsKilled = new Set<Bird>();
    for (let i = 0; i < birds.length; i++) {
        let bird = birds[i];
        bird.info.text = bird.getResult().toString();
        bird.info.x = bird.sprite.position.x - 20;
        bird.info.y = bird.sprite.position.y + 50;
        bird.info.visible = true;

        for (let j = 0; j < preds.length; j++) {
            if (bird.faced(preds[j])) {
                birdsKilled.add(bird);
                break;
            }
        }

        let closestFood = bird.getClosests(foods);
        let closestConcurent = bird.getClosests(birds);

        let closestPred: Pred = null;
        for (let j = 0; j < preds.length; j++) {
            let p = preds[j];
            if (!bird.canSee(p.sprite.position)) {
                continue;
            }
            if (bird.distance(p) < bird.distance(closestPred)) {
                closestPred = p;
            }
        }

        bird.think(closestConcurent.x, closestConcurent.y, closestFood.x, closestFood.y, closestPred);
    }

    // Food update
    foodsKilled.forEach(food => {
        food.kill();
        foods.splice(foods.indexOf(food), 1);
    });
    while (foods.length < FOOD) {
        foods.push(createFood());
    }
    if (ate.length > 500) {
        ext.food -= ate[0];
        ate.splice(0, 1);
    }

    // Birds move
    for (let i = 0; i < birds.length; i++) {
        let bird = birds[i];
        bird.sprite.rotation = bird.sprite.rotation;

        bird.sprite.position.x += Math.cos(bird.sprite.rotation) * bird.speed * delta;
        bird.sprite.position.y += Math.sin(bird.sprite.rotation) * bird.speed * delta;
        bird.sprite.position = <PIXI.Point>sanitizePosition(bird.sprite.position);
        bird.lifetime += Math.floor(delta);
    }

    // Birds kill
    birdsKilled.forEach(bird => {
        bird.kill();
        birds.splice(birds.indexOf(bird), 1);
    });

    // Birds borning
    birdsBorning();

    for (let i = 0; i < preds.length; i++) {
        let pred = preds[i];

        let tmp = pred.getClosests(birds);
        pred.think(tmp.x);

        pred.sprite.position.x += Math.cos(pred.sprite.rotation) * pred.speed * delta;
        pred.sprite.position.y += Math.sin(pred.sprite.rotation) * pred.speed * delta;
        pred.sprite.position = <PIXI.Point>sanitizePosition(pred.sprite.position);
        pred.lifetime += Math.floor(delta);
    }

    // Update info on the screen
    // birdsText.text = `Alive: ${birds.length}`;
    ext.time += 1;
    diedText.text = `Died: ${ext.died}`;
    timeText.text = `Time: ${Math.round(ext.time / 100)}`;
    let sum = 0;
    birds.forEach(bird => {
        sum += bird.getResult();
    });
    foodText.text = `Food: ${sum}`;
});

function sanitizePosition({ x, y }) {
    return {
        x: (x % app.screen.width + app.screen.width) % app.screen.width,
        y: (y % app.screen.height + app.screen.height) % app.screen.height
    };
}

function random(val) {
    return Math.floor(Math.random() * val);
}

let oldText = null;

function showNotification(msg) {
    app.stage.removeChild(oldText);
    let text = new PIXI.Text(msg, large);
    text.x = 20;
    text.y = window.screen.availHeight - 20;
    app.stage.addChild(text);
    window.setTimeout(function () { app.stage.removeChild(text); }, 2500);
    oldText = text;
}

function mutation() {
    showNotification('Mutating');
    birds[random(birds.length)].mutate();
}

function crossBrains(b1, b2) {
    let b3 = [];
    for (let i = 0; i < b1.length; i++) {
        if (Math.random() < 0.5) {
            b3.push(b1[i].clone());
        } else {
            b3.push(b2[i].clone());
        }
    }
    return b3;
}

function cross(bird1: Bird, bird2: Bird) {
    let brain = crossBrains(bird1.brain, bird2.brain);
    let bird = createBird();
    bird.brain = brain;
    return bird;
}

function byResult(p1, p2) {
    return p1.getResult() > p2.getResult() ? -1 : 1;
}

function birdsBorning() {
    const n = birds.length;
    birds.sort(byResult);
    while (birds.length < BIRDS) {
        let j = random(n);
        let k = random(n);
        let bird = cross(birds[j], birds[k]);
        birds.push(bird);
    }
}

function cleaning() {
    birds.sort(byResult);
    const best = birds[0].getResult();
    birds.reverse();

    let toDelete: Bird[] = [];
    for (let i = 0; i < birds.length / 2; i++) {
        if (birds[i].getResult() * 2 < best && !birds[i].young()) {
            toDelete.push(birds[i]);
            if (toDelete.length >= birds.length / 3) {
                break;
            }
        }
    }

    if (toDelete.length > 0) {
        showNotification(`Cleaning. ${toDelete.length} birds killed.`);
        toDelete.forEach(obj => {
            birds.splice(birds.indexOf(obj), 1);
            obj.kill();
        });

        birdsBorning();
    }
}

function deleting() {
    birds.sort(byResult);

    for (let i = 0; i < birds.length / 3; i++) {
        const num = birds.length - i - 1;
        if (!birds[num].young()) {
            showNotification('Deleting. Loser died');

            birds[num].kill();
            birds.splice(num, 1);
            diedText.text = `Died: ${ext.died}`;

            const bird = cross(birds[0], birds[random(birds.length / 2)]);
            birds.push(bird);

            break;
        }
    }
}

const small = {
    fontFamily: 'Times New Roman',
    fontSize: 20,
    fill: 'black',
    align: 'left'
};

const large = {
    fontFamily: 'Times New Roman',
    fontSize: 45,
    fill: 'black',
    align: 'left'
};

let diedText = new PIXI.Text(`Died: ${ext.died}`, large);
diedText.x = 20;
diedText.y = 20;
app.stage.addChild(diedText);

let timeText = new PIXI.Text(`Time: ${ext.time}`, large)
timeText.x = window.screen.availWidth / 2;
timeText.y = 20;
app.stage.addChild(timeText);

let foodText = new PIXI.Text(`Food: ${ext.food}`, large);
foodText.x = window.screen.availWidth;
foodText.y = 20;
app.stage.addChild(foodText);
