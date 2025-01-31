import {EPaddleSide, Paddle} from "../components/paddle";
import {Shape} from "../components/shape";
import {UIItem} from "../components/ui-item";
import {Position} from "../components/position";
import {Collision} from "../components/collision";
import {EWallSide, EWallType, Wall} from "../components/wall";
import {CResourceMarker, CResourceMarkerValue} from "sim-ecs";


export const defaultBallPositionX = 0.49;
export const defaultBallPositionY = 0.49;
export const defaultBallVelocityX = 0.005 / 2;
export const defaultBallVelocityY = 0.007 / 2;

// This could also be pure JSON, but in order to use TS types and have static checks it is recommended to write it as TS array.
export const gamePrefab = [
    { // Resources
        [CResourceMarker]: CResourceMarkerValue,
        ScoreBoard: {
            left: 0,
            right: 0,
        }
    },
    { // Left wall
        Wall: <Wall>{
            wallSide: EWallSide.Left,
            wallType: EWallType.Vertical,
        },
        Collision: <Collision>{},
        Position: <Position>{
            x: -1,
            y: 0,
        },
        Shape: <Shape>{
            color: 'black',
            dimensions: {
                width: 1,
                height: 1,
            },
        },
    },
    { // Right wall
        Wall: <Wall>{
            wallSide: EWallSide.Right,
            wallType: EWallType.Vertical,
        },
        Collision: <Collision>{},
        Position: <Position>{
            x: 1,
            y: 0,
        },
        Shape: <Shape>{
            color: 'black',
            dimensions: {
                width: 1,
                height: 1,
            },
        },
    },
    { // Top wall
        Wall: <Wall>{wallType: EWallType.Horizontal},
        Collision: <Collision>{},
        Position: <Position>{
            x: 0,
            y: -1,
        },
        Shape: <Shape>{
            color: 'black',
            dimensions: {
                width: 1,
                height: 1,
            },
        },
    },
    { // Bottom wall
        Wall: <Wall>{wallType: EWallType.Horizontal},
        Collision: <Collision>{},
        Position: <Position>{
            x: 0,
            y: 1,
        },
        Shape: <Shape>{
            color: 'black',
            dimensions: {
                width: 1,
                height: 1,
            },
        },
    },
    { // Left points
        Paddle: <Paddle>{
            side: EPaddleSide.Left,
        },
        UIItem: <UIItem>{
            caption: 'Points Left: {}',
            color: '#ddd',
            fontSize: 24,
        },
        Position: <Position>{
            x: 0.1,
            y: 0.1,
        },
    },
    { // Right points
        Paddle: <Paddle>{
            side: EPaddleSide.Right,
        },
        UIItem: <UIItem>{
            caption: 'Points Right: {}',
            color: '#ddd',
            fontSize: 24,
        },
        Position: <Position>{
            x: 0.1,
            y: 0.15,
        },
    },
];
