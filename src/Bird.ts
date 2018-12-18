import * as numpy from "numjs";
import { MapObject } from "./MapObject";
import { ext } from './extensionVariables';
import { angle, distance, randomRotation, randomPoint } from './methods';

const TIME_RANGE = 1000;
const BIRD_TEXTURE = PIXI.Texture.fromImage('../pictures/frame-1.png');
const DEAD_TEXTURE = PIXI.Texture.fromImage('../pictures/rip.png');

export class Bird extends MapObject {
    public sprite: PIXI.Sprite;
    public speed: number;
    public result: number;
    public lifetime: number;
    public brain;
    public alive: boolean;
    public info: PIXI.Text;
    private foods: number[];

    // private textureCounter: number = 0;
    // private updateTexture = () => {
    //     const BIRD_FRAME_LIST = [
    //         '../picutres/frame-1.png',
    //         '../picutres/frame-2.png',
    //         '../picutres/frame-3.png',
    //         '../picutres/frame-4.png',
    //     ];
    //     this.sprite.texture = PIXI.loader.resources[BIRD_FRAME_LIST[this.textureCounter++]].texture;
    //     if (this.textureCounter === BIRD_FRAME_LIST.length) this.textureCounter = 0;
    // }

    constructor(result, lifetime, brain, info, position) {
        super();
        this.sprite = new PIXI.Sprite(BIRD_TEXTURE);
        this.sprite.scale.set(0.13);
        this.sprite.anchor.set(0.5);

        let { x, y } = position ? position : randomPoint();
        this.sprite.position.set(x, y);
        this.sprite.rotation = randomRotation();

        this.speed = 0;
        this.lifetime = lifetime;
        this.brain = brain ? brain : this.randomBrain(10, 2);
        this.info = info;
        this.alive = true;
        this.foods = [];
        while (result > 0) {
            result--;
            this.foods.push(lifetime);
        }

        ext.app.stage.addChild(this.sprite);
        ext.app.stage.addChild(this.info);
        // setInterval(this.updateTexture, 200);
    }

    public randomLayer(shape) {
        return numpy.random(shape).subtract(0.5);
    }

    public randomBrain(input, output) {
        return [this.randomLayer([input + 1, 20]),
        this.randomLayer([21, 30]),
        //this.randomLayer([31, 30]),
        this.randomLayer([31, 20]),
        this.randomLayer([21, output])];
        // return [this.randomLayer([input + 1, 20]),
        // this.randomLayer([21, 30]),
        // //this.randomLayer([31, 30]),
        // this.randomLayer([31, 20]),
        // this.randomLayer([21, output])];
    }

    public mutate() {
        for (let i = 0; i < this.brain.length; i++) {
            if (Math.random() < 0.1) {
                this.brain[i] = this.randomLayer(this.brain[i].shape);
            }
        }
    }

    private interpolate(val1: number, val2: number): number {
        return val1 + (val2 - val1) * 0.5;
    }

    private proc(obj) {
        let x = obj == null ? 0 : angle(this.sprite, obj.sprite.position);
        let y = obj == null ? 0 : distance(this.sprite.position, obj.sprite.position) / 1000;
        return { x, y };
    }

    public think = (bird1, bird2, food1, food2, pred): void => {
        let b1 = this.proc(bird1);
        let b2 = this.proc(bird2);
        let f1 = this.proc(food1);
        let f2 = this.proc(food2);
        let p = this.proc(pred);

        let delta = this.propagate(numpy.array([b1.x, b1.y, b2.x, b2.y, f1.x, f1.y, f2.x, f2.y, p.x, p.y]), this.brain);
        let deltaRotation = delta.get(0);
        let deltaSpeed = delta.get(1);

        this.sprite.rotation = this.interpolate(this.sprite.rotation, this.sprite.rotation + deltaRotation);
        this.speed = Math.max(0, Math.min(5, this.interpolate(this.speed, this.speed + deltaSpeed)));
    }

    private showDead({ x, y }): void {
        var sprite = new PIXI.Sprite(DEAD_TEXTURE);
        sprite.scale.set(0.04);
        sprite.position.set(x, y);
        ext.app.stage.addChild(sprite);
        window.setTimeout(function () { ext.app.stage.removeChild(sprite); }, 2500);
    }

    public young = (): boolean => {
        return this.lifetime <= TIME_RANGE / ext.app.ticker.speed;
    }

    public kill = () => {
        if (this.alive) {
            ++ext.died;
            this.alive = false;
            this.showDead(this.sprite.position);
        }
        ext.app.stage.removeChild(this.sprite);
        ext.app.stage.removeChild(this.info);
    }

    public success = (): void => {
        this.foods.push(this.lifetime);
    }

    public getResult = (): number => {
        while (this.foods.length && this.lifetime - this.foods[0] > TIME_RANGE / ext.app.ticker.speed) {
            this.foods.shift();
        }
        return this.foods.length;
    }
}
