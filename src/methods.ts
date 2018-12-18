import { ext } from './extensionVariables';

export function angle(obj, pos): number {
    let c = cosine(obj, pos);
    let s = sine(obj, pos);
    return s < 0 ? -Math.acos(c) : Math.acos(c);
}

export function distance(pos1, pos2) {
    let sqr = function (x) { return x * x; };
    return Math.sqrt(sqr(pos1.x - pos2.x) + sqr(pos1.y - pos2.y));
}

export function dist(pos) {
    return distance({ x: 0, y: 0 }, pos);
}

export function diff(pos1, pos2) {
    return {
        x: pos2.x - pos1.x,
        y: pos2.y - pos1.y
    };
}

export function cosine(obj, pos) {
    let d = diff(obj.position, pos);
    return (Math.cos(obj.rotation) * d.x + Math.sin(obj.rotation) * d.y) / dist(d);
}

export function sine(obj, pos) {
    let d = diff(obj.position, pos);
    return (Math.cos(obj.rotation) * d.y - Math.sin(obj.rotation) * d.x) / dist(d);
}

export function randomPoint() {
    return {
        x: Math.random() * ext.app.screen.width,
        y: Math.random() * ext.app.screen.height
    };
}

export function randomRotation() {
    return 2 * Math.PI * Math.random();
}
