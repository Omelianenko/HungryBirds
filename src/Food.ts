import * as numpy from "numjs";
import { MapObject } from "./MapObject";
import { ext } from './extensionVariables';
import { angle, distance, randomRotation } from './methods';

const FOOD_TEXTURE = PIXI.Texture.fromImage('../pictures/food.png');

export class Food extends MapObject {
    public sprite: PIXI.Sprite;
    public speed: number;
    public lifetime: number;
    public brain;
    public alive: boolean;
    public info: PIXI.Text;

    constructor(position) {
        super();
        this.sprite = new PIXI.Sprite(FOOD_TEXTURE);
        this.sprite.scale.set(0.02);
        this.sprite.anchor.set(0.5);

        let { x, y } = position;
        this.sprite.position.set(x, y);
        this.sprite.rotation = randomRotation();

        this.speed = 0;
        this.alive = true;

        ext.app.stage.addChild(this.sprite);
    }

    private interpolate(val1: number, val2: number): number {
        return val1 + (val2 - val1) / 2;
    }

    public propagate(input, nn) {
        for (let i = 0; i < nn.length; i++) {
            input = numpy.arctan(numpy.dot(numpy.concatenate([1, input]), nn[i]));
            // input = numpy.tanh(numpy.dot(numpy.concatenate([1, input]), nn[i]));
        }
        return input;
    }

    public think = (bird, food, pred): void => {
        let a1 = bird == null ? 0 : angle(this.sprite, bird.sprite.position);
        let d1 = bird == null ? 0 : distance(this.sprite.position, bird.sprite.position) / 1000;
        let a2 = food == null ? 0 : angle(this.sprite, food.sprite.position);
        let d2 = food == null ? 0 : distance(this.sprite.position, food.sprite.position) / 1000;
        let a3 = pred == null ? 0 : angle(this.sprite, pred.sprite.position);
        let d3 = pred == null ? 0 : distance(this.sprite.position, pred.sprite.position) / 1000;
        let delta = this.propagate(numpy.array([a1, d1, a2, d2, a3, d3]), this.brain);
        let deltaRotation = delta.get(0);
        let deltaSpeed = delta.get(1);
        this.sprite.rotation = this.interpolate(this.sprite.rotation, this.sprite.rotation + deltaRotation);
        this.speed = Math.max(0, Math.min(5, this.interpolate(this.speed, this.speed + deltaSpeed)));
    }

    public kill = () => {
        if (this.alive) {
            this.alive = false;
        }
        ext.app.stage.removeChild(this.sprite);
        ext.app.stage.removeChild(this.info);
    }
}
