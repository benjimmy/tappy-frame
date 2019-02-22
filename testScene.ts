module Tappy {

    export class TestScene extends Phaser.Scene {

        constructor() {
            super({key:'TestScene'});
        }
        startX:number = 40;
        
        speed:number = 720 / 2000;
        frame:number = 0;    
        
        stateRunning:boolean = false;
        stateStartTime:number;
        stateFinished:boolean = false;


        sceneTime:Phaser.GameObjects.BitmapText;  
        running:Phaser.GameObjects.BitmapText;          

        scenets:Phaser.GameObjects.BitmapText;  
        scenedt:Phaser.GameObjects.BitmapText; 
        
        frameTick: Phaser.Geom.Line;
        frameRuler: Phaser.Geom.Line;
        
        mainline: Phaser.Geom.Line;
        graphics:Phaser.GameObjects.Graphics;

        mouseButton: Phaser.GameObjects.Text[] = [];
        
        preload() {
            this.load.bitmapFont('luc',['./Fonts/lucidaconsole_0.png','./Fonts/lucidaconsole_1.png'],'./Fonts/lucidaconsole.xml');
        }
 
        create() {
            this.input.mouse.disableContextMenu();

            this.graphics = this.add.graphics({lineStyle: {width:1,color: 0xff0000}});
            this.mainline = new Phaser.Geom.Line(this.startX,300,760,300)
            this.graphics.strokeLineShape(this.mainline)

            this.frameTick  = new Phaser.Geom.Line(0,0,0,0)
            this.frameRuler = new Phaser.Geom.Line(this.startX,320,this.startX,320)
            
            this.input.on('pointerdown', this.clicked, this);

            this.sceneTime = this.add.bitmapText(220,300,'luc','',16);
            this.scenedt = this.add.bitmapText(220,32,'luc','',16);
            this.scenets = this.add.bitmapText(220,50,'luc','',16);
            this.running = this.add.bitmapText(220,400,'luc','RUNNING',32)
            this.running.setAlpha(0);
        }


        update(timestep,dt)
        {
            this.scenedt.setText(dt);
            this.scenets.setText(<string>timestep);
            
            if (this.stateRunning ) {
                if (!this.stateFinished)
                {
                    
                    let x = this.frameRuler.x2 += 6 // this.speed * dt;
                    this.frameRuler.x2 = x;
                    this.frameTick.setTo(x,320,x,300);
                    this.graphics.strokeLineShape(this.frameRuler);
                    
                    if (this.input.activePointer.isDown) this.graphics.lineStyle(1, 0x00ff00) ;
                    else this.graphics.lineStyle(1,0xff0000);
                    
                    this.graphics.strokeLineShape(this.frameTick);

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
            //stateFinished is a buffer so late clicks don't cause it to start again.
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
                this.mouseButton.forEach(element => { element.destroy() });

                this.stateStartTime = this.sys.game.loop.time
                this.running.setAlpha(1)
                this.frameRuler.x2 = 40
                this.graphics.clear();
                this.graphics.strokeLineShape(this.mainline)
                this.graphics.lineStyle(1,0xffffff);
                this.graphics.strokeLineShape(new Phaser.Geom.Line(43,290,43,360)) //should be halfway through frame... Frame size 6?

            }

        }

    }
}