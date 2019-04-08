module Tappy {

  
    export class FrameMenu extends Phaser.Scene {

        
        constructor() {
            super({key:'MenuScene'});
        }

        preload() {
            this.load.json('Paul','./json/Paul/demoman.json');
            this.load.json('Lee','./json/Lee/acidrain.json');

        }
        create() {
            this.input.mouse.disableContextMenu();

            
            this.add.text(50,150,"Paul",mediumText).setInteractive()
            this.add.text(50,350,"Lee",mediumText).setInteractive()
            
            this.input.once('gameobjectdown',this.clicked,this)

        }

        clicked(pointer:Phaser.Input.Pointer,gameobject){
            if (gameobject.text == 'Paul' ) this.scene.start('FrameGame',this.cache.json.get('Paul'));
            else if(gameobject.text == 'Lee' ) this.scene.start('FrameGame',this.cache.json.get('Lee'));
        }


    }


}