/// <reference path='./phaser.d.ts'/>

module Tappy{
    export class InitPhaser {
 
        static gameRef:Phaser.Game;
 
        public static initGame() {
 
            let config = {
                type: Phaser.WEBGL,
                disableContextMenu: true,
                input: {
                    queue: false,
                    gamepad: true
                },
                scale: {
                    mode: Phaser.Scale.FIT,
                    
                    autoCenter: Phaser.Scale.CENTER_HORIZONTALLY,
                    width: 1200,
                    height: 600
                },                
                scene: [FrameGame,FrameMenu],
                banner: true,
                title: 'Tappy',
                version: '1.0.0'
            }
 
            this.gameRef = new Phaser.Game(config);
        }
    }
}
 
window.onload = () => {
    Tappy.InitPhaser.initGame();
};