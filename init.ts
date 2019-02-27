/// <reference path='./phaser.d.ts'/>
module Tappy{
    export class InitPhaser {
 
        static gameRef:Phaser.Game;
 
        public static initGame() {
 
            let config = {
                type: Phaser.WEBGL,
                scale: {
                    mode: Phaser.Scale.FIT,
                    autoCenter: Phaser.Scale.CENTER_BOTH,
                    width: 1200,
                    height: 675
                },                
                scene: [TestScene],
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