module Tappy {

    export class TestScene extends Phaser.Scene {

        constructor() {
            super({key:'TestScene'});
        }

        stateRunning:boolean = false;
        stateStartTime:number;
        stateFinished:boolean = false;

        logo:Phaser.GameObjects.Image;
        sceneTime:Phaser.GameObjects.BitmapText;
        delta:Phaser.GameObjects.BitmapText;
        speed:number = 720 / 2000;

        scenets;
        scenedt;
        running:Phaser.GameObjects.BitmapText;
        frame:number = 0;

        frameRuler: Phaser.Geom.Line[] = [];
        mainline: Phaser.Geom.Line;
        graphics:Phaser.GameObjects.Graphics;

        mouseButton: Phaser.GameObjects.Text[] = [];
        
        preload() {
            //this.state.running = false;

            this.load.image("benalex","./benalex.png");
            this.load.bitmapFont('luc',['./Fonts/lucidaconsole_0.png','./Fonts/lucidaconsole_1.png'],'./Fonts/lucidaconsole.xml');
        }
 
        create() {
            this.input.mouse.disableContextMenu();

            this.graphics = this.add.graphics({lineStyle: {width:1,color: 0xff0000}});
            this.mainline = new Phaser.Geom.Line(40,300,760,300)
            this.graphics.strokeLineShape(this.mainline)

            for (let i=0; i <120; i++ ){
                this.frameRuler.push(new Phaser.Geom.Line(0,0,0,0))
            }

            this.frameRuler.push(new Phaser.Geom.Line(40,320,40,320))
            

            this.input.on('pointerdown', this.clicked, this);

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
            this.running = this.add.bitmapText(220,400,'luc','RUNNING',32)
            this.running.setAlpha(0);
        }



        update(timestep,dt)
        {
            
            //this.logo.x += this.speed * dt;
            
            //this.sceneTime.setText(this.sys.game.loop.time.toString());
            this.delta.setText(<string[]><unknown>this.sys.game.loop.deltaHistory);
            this.scenedt.setText(dt);
            this.scenets.setText(<string>timestep);
            
            if (this.stateRunning ) {
                if (!this.stateFinished)
                {
                    
                    let x = this.frameRuler[120].x2 += this.speed * dt;
                    this.frameRuler[120].x2 = x;
                    this.frameRuler[0].setTo(x,320,x,300);
                    this.graphics.strokeLineShape(this.frameRuler[120]);
                    if (this.input.activePointer.isDown) this.graphics.lineStyle(1, 0x00ff00) ;
                    else this.graphics.lineStyle(1,0xff0000);
                    
                    this.graphics.strokeLineShape(this.frameRuler[0]);
                    


                    if (this.sys.game.loop.time - this.stateStartTime > 2000) this.stateFinished = true;

                }

                if (this.sys.game.loop.time - this.stateStartTime > 3000) {
                    this.stateRunning = false;
                    this.running.setAlpha(0);
                    this.frame = 0

                }

            }


        }

        clicked(pointer:Phaser.Input.Pointer)
        {
            if (this.stateRunning && !this.stateFinished){
                

                let dt = pointer.time - this.stateStartTime;
                let x = 40 + this.speed * dt;

                let clickStartLine = new Phaser.Geom.Line(x,290,x,360)
                this.graphics.lineStyle(1,0xffffff);
                this.graphics.strokeLineShape(clickStartLine);
                
                this.mouseButton.push(this.add.text(x-2,360,pointer.buttons.toString(),{ fontFamily: 'Arial', fontSize: 8, color: '#ffffff' }));
                
                
             
            }
            if (!this.stateRunning)
            {
                this.stateRunning = true;
                this.stateFinished = false;

                this.stateStartTime = this.sys.game.loop.time
                this.running.setAlpha(1)
                this.frameRuler[120].x2 = 40
                this.graphics.clear();
                this.graphics.strokeLineShape(this.mainline)
                this.mouseButton.forEach(element => {
                    element.destroy()
                });

            }

        }

    }
}