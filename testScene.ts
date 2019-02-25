module Tappy {

    export class TestScene extends Phaser.Scene {

        constructor() {
            super({key:'TestScene'});
        }
        
        //Globals
        smallText:any = { fontFamily: 'Arial', fontSize: 8, color: '#ffffff' };
        mediumText:any = { fontFamily: 'Arial', fontSize: 14, color: '#ffffff' }
        startX:number = 40;
        speed:number;
        
        //moveFrameObject
        justFrameMove:any;
        frameWidth:number;
        lastFrame:number;

        //moveDisplay
        redFrame:Phaser.Geom.Rectangle[] = [];
        
        //state
        stateRunning:boolean = false;
        stateFinished:boolean = false;
        frame:number = 0;    //dont trust this for calc - only for realtime view.
        stateStartTime:number;        

        //create objects
        frameTick: Phaser.Geom.Line;
        frameRuler: Phaser.Geom.Line;        
        mainline: Phaser.Geom.Line;
        graphics:Phaser.GameObjects.Graphics;

        //run objects
        sceneTime:Phaser.GameObjects.BitmapText;  
        running:Phaser.GameObjects.BitmapText;          
        mouseButton: Phaser.GameObjects.Text[] = [];


        //old
        scenets:Phaser.GameObjects.BitmapText;  
        scenedt:Phaser.GameObjects.BitmapText; 
        
        
        preload() {
            this.load.bitmapFont('luc',['./Fonts/lucidaconsole_0.png','./Fonts/lucidaconsole_1.png'],'./Fonts/lucidaconsole.xml');
            this.load.json('moveFrames','./json/Lee/acidrain.json');
        }
 
        create() {
            this.input.mouse.disableContextMenu();

            this.justFrameMove = this.cache.json.get('moveFrames');

            this.lastFrame = this.justFrameMove.JustFrames[this.justFrameMove.JustFrames.length-1].latestFrame + 15
            this.speed = 720 / this.lastFrame / 16.666666666666667;
            this.frameWidth = Math.round(720 / this.lastFrame);  //note-needs rounding???
        
            this.add.text(this.startX,150,this.justFrameMove.MoveName,this.mediumText)
            this.add.text(this.startX,170,this.justFrameMove.MoveNotation,this.mediumText)
            this.add.text(this.startX,190,this.justFrameMove.Notes,this.mediumText)

            let graphicsGuide = this.add.graphics({lineStyle: {width:1,color: 0xff0000},fillStyle: {color: 0x660000,alpha:1}});
            for (let i=0;i<this.lastFrame;i++)
            {
                this.add.text(this.startX + i*this.frameWidth + this.frameWidth/2,290,i.toString(),this.smallText).setOrigin(0.5)
                this.redFrame.push(new Phaser.Geom.Rectangle(this.startX + i*this.frameWidth,250,this.frameWidth-2,30))
                
            }
            this.redFrame.forEach(frame => {
                graphicsGuide.strokeRectShape(frame);
                graphicsGuide.fillRectShape(frame);            
            });

            this.justFrameMove.JustFrames.forEach(jf => {
                //early / late frame = blue - todo movestuff...
                graphicsGuide.lineStyle(1,0x0000ff)
                graphicsGuide.fillStyle(0x000077)
                for (let i = jf.earlyFrame; i < jf.latestFrame; i++){
                    graphicsGuide.fillRectShape(this.redFrame[i])
                    graphicsGuide.strokeRectShape(this.redFrame[i])
                }
                graphicsGuide.lineStyle(1,0x00ff00)
                graphicsGuide.fillStyle(0x007700)

                graphicsGuide.fillRectShape(this.redFrame[jf.justFrame])
                graphicsGuide.strokeRectShape(this.redFrame[jf.justFrame])

                this.add.text(this.startX + jf.justFrame*this.frameWidth +this.frameWidth/2,240,jf.move,{ fontFamily: 'Arial', fontSize: 8, color: '#ffffff' }).setOrigin(0.5)
                
               
            });


            //this is for the realtime line - though the top is drawn upfront.
            this.graphics = this.add.graphics({lineStyle: {width:1,color: 0xff0000}});
            this.mainline = new Phaser.Geom.Line(this.startX,300,this.startX + this.frameWidth*this.lastFrame,300)
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
                this.frame++;
                if (!this.stateFinished)
                {
                    
                    let x = this.frameRuler.x2 += this.frameWidth // this.speed * dt;
                    this.frameRuler.x2 = x;
                    this.frameTick.setTo(x,320,x,300);
                    this.graphics.strokeLineShape(this.frameRuler);
                    
                    if (this.input.activePointer.isDown) this.graphics.lineStyle(1, 0x00ff00) ;
                    else this.graphics.lineStyle(1,0xff0000);
                    
                    this.graphics.strokeLineShape(this.frameTick);

                    if (this.frame >= this.lastFrame) this.stateFinished = true;

                }

                if (this.frame >= this.lastFrame + 30) {
                    this.stateRunning = false;
                    this.running.setAlpha(0);
                    

                }
            }
        }

        clicked(pointer:Phaser.Input.Pointer)
        {
            //stateFinished is a buffer so late clicks don't cause it to start again.
            if (this.stateRunning && !this.stateFinished){
                
                let dt = pointer.time - this.stateStartTime;
                let x = 40 + this.speed * dt;

                let clickStartLine = new Phaser.Geom.Line(x,300,x,360)
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
                let firstClickX = 40 + this.frameWidth / 2;
                this.graphics.strokeLineShape(new Phaser.Geom.Line(firstClickX,290,firstClickX,360)) //should be halfway through frame... Frame size 6?
                this.frame = 0

            }

        }

    }
}