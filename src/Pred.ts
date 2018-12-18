import * as numpy from "numjs";
import { ext } from './extensionVariables';
import { angle, distance, /*randomRotation*/ } from './methods';
import { MapObject } from "./MapObject";

const PRED_TEXTURE = PIXI.Texture.fromImage('../pictures/pred.png');
const DEAD_TEXTURE = PIXI.Texture.fromImage('../pictures/rip.png');

export class Pred extends MapObject {
    public sprite: PIXI.Sprite;
    public speed: number;
    public result: number;
    public lifetime: number;
    public brain;
    public info: PIXI.Text;

    constructor(info, position) {
        super()
        this.sprite = new PIXI.Sprite(PRED_TEXTURE);
        this.sprite.scale.set(0.13);
        this.sprite.anchor.set(0.5);

        let { x, y } = position;
        this.sprite.position.set(x, y);
        this.sprite.rotation = 0; // randomRotation();

        this.speed = 0;
        this.lifetime = 0;
        this.info = info;
        this.result = 0;
    }

    private interpolate(val1: number, val2: number): number {
        return val1 + (val2 - val1) * 0.7;
    }

    public propagate(input, nn) {
        for (let i = 0; i < nn.length; i++) {
            input = numpy.tanh(numpy.dot(numpy.concatenate([1, input]), nn[i]));
        }
        return input;
    }

    private proc(obj) {
        let x = obj == null ? 0 : angle(this.sprite, obj.sprite.position);
        let y = obj == null ? 0 : distance(this.sprite.position, obj.sprite.position) / 1000;
        return { x, y };
    }

    public think = (bird): void => {
        let a = this.proc(bird);
        let deltaRotation = a.x;
        this.sprite.rotation = this.interpolate(this.sprite.rotation, this.sprite.rotation + deltaRotation);
        this.speed = 1;
        // this.speed = Math.max(0, Math.min(5, this.interpolate(this.speed, this.speed + deltaSpeed)));
    }

    public getResult = (): number => {
        return this.result;
    }

    private showDead({ x, y }): void {
        var sprite = new PIXI.Sprite(DEAD_TEXTURE);
        sprite.scale.set(0.04);
        sprite.position.set(x, y);
        ext.app.stage.addChild(sprite);
        window.setTimeout(function () { ext.app.stage.removeChild(sprite); }, 2500);
    }

    public kill = () => {
        this.showDead(this.sprite.position);
        ext.app.stage.removeChild(this.sprite);
        ext.app.stage.removeChild(this.info);
    }
}
