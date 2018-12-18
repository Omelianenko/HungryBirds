import * as numpy from 'numjs';
import { cosine, distance } from './methods'

export class MapObject {
    sprite: PIXI.Sprite;
    speed: number;
    lifetime: number;
    info: PIXI.Text;
    brain;

    public propagate(input, nn) {
        for (let i = 0; i < nn.length; i++) {
            input = numpy.arctan(numpy.dot(numpy.concatenate([1, input]), nn[i]));
        }
        return input;
    }

    public distance(obj?: MapObject): number {
        if (!obj) {
            return 1 << 30;
        }
        return distance({ x: this.sprite.position.x, y: this.sprite.position.y }, { x: obj.sprite.position.x, y: obj.sprite.position.y });
    }

    public canSee = (pos): boolean => {
        return cosine(this.sprite, pos) >= 0;
    }

    public faced = (obj: MapObject): boolean => {
        return this.distance(obj) < 35;
    }

    public getClosests = (objs: MapObject[]) => {
        let x = null;
        let y = null;
        for (let j = 0; j < objs.length; j++) {
            let obj = objs[j];
            if (!this.canSee(obj.sprite.position)) {
                continue;
            }
            if (this.distance(obj) < this.distance(x)) {
                y = x;
                x = obj;
            }
            else if (this.distance(obj) < this.distance(y)) {
                y = obj;
            }
        }

        return { x, y };
    }
}
