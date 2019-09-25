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
            let y = 150

            this.data.forEach(char => {
                this.add.text(50, y, char.Character, mediumText)
                char.JustFrameMoves.forEach(move => {
                    this.add.text(200, y, move.MoveName, mediumText).setInteractive().setData("move", move)
                    y += 50
                });

            });

            this.input.once('gameobjectdown', this.clicked, this)

        }

        clicked(pointer: Phaser.Input.Pointer, gameobject) {
            this.scene.start('FrameGame', gameobject.getData("move"));

        }


    }


}