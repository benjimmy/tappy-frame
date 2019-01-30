module Tappy {
 
    export class TestScene extends Phaser.Scene {

        constructor() {
            super({key:'TestScene'});
        }

        logo:Phaser.GameObjects.Image;
        sceneTime:Phaser.GameObjects.BitmapText;
        delta:Phaser.GameObjects.BitmapText;
        speed:number = <number>Tappy.InitPhaser.gameRef.config['width']/2 / 1000;
        scenets;
        scenedt;

        
        preload() {
            this.load.image("benalex","./benalex.png");
            this.load.bitmapFont('luc',['./Fonts/lucidaconsole_0.png','./Fonts/lucidaconsole_1.png'],'./Fonts/lucidaconsole.xml');
        }
 
        create() {
            this.logo = this.add.image(<number>Tappy.InitPhaser.gameRef.config['width']/2,<number>Tappy.InitPhaser.gameRef.config['height']/2,'benalex');
            this.logo.setScale(.5,.5);
/*
            let tween = this.tweens.add({
                targets: this.logo,
                scaleX: { value: 1.0, duration: 2000, ease: 'Back.easeInOut' },
                scaleY: { value: 1.0, duration: 2000, ease: 'Back.easeInOut' },
                yoyo: false,
                repeat: 10
                });
  */          
            this.sceneTime = this.add.bitmapText(220,300,'luc','',16);
            this.delta = this.add.bitmapText(32,32,'luc','',16);
            this.scenedt = this.add.bitmapText(220,32,'luc','',16);
            this.scenets = this.add.bitmapText(220,50,'luc','',16);
            
        }

        update(timestep,dt)
        {
            //this.logo.x += this.speed * dt;
            if (this.logo.x > 600)
            {
                this.logo.x = 0
            }

            this.sceneTime.setText(this.sys.game.loop.time.toString());
            this.delta.setText(<string[]><unknown>this.sys.game.loop.deltaHistory);
            this.scenedt.setText(dt);
            this.scenets.setText(<string>timestep);
            



        }
    }
}