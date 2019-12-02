module Tappy {


    export class FrameMenu extends Phaser.Scene {

        data: any

        constructor() {
            super({ key: 'MenuScene' });
        }

        preload() {  // Change design.  1. file per char.

            this.load.json('jfData', './movesjson/justframedata.json');

        }
        create() {
            this.data = this.cache.json.get('jfData')
            let y = 40
            let x = gameWidth - 100
            this.data.forEach(char => {
                tappyTools.centerButtonText( this.add.text(0, 0, char.Character, mediumText),
                                             this.add.sprite(x,y,'blueButton').setVisible(false));
                y+=30
                char.JustFrameMoves.forEach(move => {
                    tappyTools.centerButtonText( this.add.text(0, 0, move.MoveName, mediumText),
                                                 this.add.sprite(x,y,'blueButton').setInteractive().setData("move", move));
                    y += 50
                });
                y+=10
                
            });

            this.input.once('gameobjectdown', this.clicked, this)

        }

        clicked(pointer: Phaser.Input.Pointer, gameobject) {
            this.scene.start('FrameGame', gameobject.getData("move"));

        }


    }


}