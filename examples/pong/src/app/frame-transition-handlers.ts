import {GameStore} from "../models/game-store";
import {ITransitionActions} from "sim-ecs";
import {MenuState} from "../states/menu";

let lastTransition = Date.now();

export async function afterFrameHandler(actions: ITransitionActions) {
    const gameStore = actions.getResource(GameStore);

    if (gameStore.exit) {
        actions.stopRun();
        return;
    }

    if (gameStore.popState) {
        await actions.popState();
        gameStore.popState = false;
    }

    if (gameStore.PushState) {
        await actions.pushState(gameStore.PushState);
        gameStore.PushState = undefined;
    }

    if (gameStore.backToMenu) {
        while (actions.currentState?.constructor != MenuState) {
            await actions.popState();
        }

        gameStore.backToMenu = false;
    }
}

export async function beforeFrameHandler(actions: ITransitionActions) {
    const gameStore = actions.getResource(GameStore);

    { // Update info
        gameStore.currentState = actions.currentState;
    }

    { // Update delta time
        const now = Date.now();
        gameStore.lastFrameDeltaTime = now - lastTransition;
        lastTransition = now;
    }

    { // Clear canvas
        gameStore.ctx.beginPath();
        gameStore.ctx.fillStyle = '#222';
        gameStore.ctx.fillRect(0, 0, gameStore.ctx.canvas.width, gameStore.ctx.canvas.height);
        gameStore.ctx.stroke();
    }
}
