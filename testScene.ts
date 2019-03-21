module Tappy {
    export class TestScene extends Phaser.Scene {

        constructor() {
            super({key:'TestScene'});
        }
        //Globals
        smallText:any = { fontFamily: 'Arial', fontSize: 12, color: '#ffffff' };
        mediumText:any = { fontFamily: 'Arial', fontSize: 18, color: '#ffffff' }
        largeText:any = { fontFamily: 'Arial', fontSize: 28, color: '#ffffff' }
        startX:number = 60;
        gameWidth:number = 1080
        speed:number;
    //Phaser.Math.FloorTo
        //moveFrameObject
        justFrameMove:justFrames;
        frameWidth:number;
        lastFrame:number;

        //moveDisplay
        frameBoxes:Phaser.Geom.Rectangle[] = [];
        
        //state
        stateRunning:boolean = false;
        stateShowResults:boolean = false;
        frame:number = 0;    //dont trust this for calc - only for realtime view.
        stateStartTime:number;        

        //create objects
        frameTick: Phaser.Geom.Line;
        frameRuler: Phaser.Geom.Line;        
        graphics:Phaser.GameObjects.Graphics;

        //run objects
        sceneTime:Phaser.GameObjects.BitmapText;  
        running:Phaser.GameObjects.Text;          
        mouseButton: Phaser.GameObjects.Text[] = [];
        scenefps:Phaser.GameObjects.BitmapText;

        //result objects
        results:resultset

        preload() {
            this.load.bitmapFont('luc',['./Fonts/lucidaconsole_0.png','./Fonts/lucidaconsole_1.png'],'./Fonts/lucidaconsole.xml');
            this.load.json('moveFrames','./json/Lee/acidrain.json');
        }
 
        create() {
            this.input.mouse.disableContextMenu();

            this.justFrameMove = <justFrames> this.cache.json.get('moveFrames');

            this.lastFrame = this.justFrameMove.JustFrames[this.justFrameMove.JustFrames.length-1].latestFrame + 5;
            this.frameWidth = Math.round(this.gameWidth / this.lastFrame);  //round it into clean frame size
            this.gameWidth = this.frameWidth * this.lastFrame               //multiply it back into clean gamewidth 
                                                                            // might be a practical minimum size for this. 3 frames probably... 
                                                                            // 3 frames times 60 = 180 + edges...

            this.speed = this.gameWidth / this.lastFrame / oneFrame;        //speed still less accurate probably... only for realtime
        
            this.add.text(this.startX,150,this.justFrameMove.MoveName,this.mediumText)
            this.add.text(this.startX,170,this.justFrameMove.MoveNotation,this.mediumText)
            this.add.text(this.startX,190,this.justFrameMove.Notes,this.mediumText)


            /* REDO all this 
            1. to make the effect of push frames clearer.
            2. to show which buttons are for when
            3. to show optional buttons.
            4. recommended frames???
            5. late frames vs push frames.

            I need to know though, if it only ever happens on the first one.
            */

            let graphicsGuide = this.add.graphics({lineStyle: {width:1,color: 0xff0000},fillStyle: {color: 0x660000,alpha:1}});
            // make the whole set red.
            for (let i=0;i<=this.lastFrame;i++) {
                this.add.text(this.startX + i*this.frameWidth + this.frameWidth/2,290,i.toString(),this.smallText).setOrigin(0.5)
                this.frameBoxes.push(new Phaser.Geom.Rectangle(this.startX + i*this.frameWidth,250,this.frameWidth-2,30))
            }

            this.frameBoxes.forEach(frame => {
                graphicsGuide.strokeRectShape(frame);
                graphicsGuide.fillRectShape(frame);            
            });


            this.justFrameMove.JustFrames.forEach(jf => {

                if (!jf.optional) {  // just until I have a better plan


        
                    this.add.text(this.startX + jf.justFrame*this.frameWidth +this.frameWidth/2,240,jf.move.toString(),this.smallText).setOrigin(0.5)  

                    //early = blue
                    graphicsGuide.lineStyle(1,0x0000ff)
                    graphicsGuide.fillStyle(0x000077)

                    for (let i = jf.earlyFrame; i < jf.justFrame; i++) {
                        graphicsGuide.fillRectShape(this.frameBoxes[i])
                        graphicsGuide.strokeRectShape(this.frameBoxes[i])
                    }

                    //late = purple
                    graphicsGuide.lineStyle(1,0xcc00ff)
                    graphicsGuide.fillStyle(0x550077)
                    for ( let i = jf.justFrame+1; i<= jf.latestFrame; i++) {
                        graphicsGuide.fillRectShape(this.frameBoxes[i])
                        graphicsGuide.strokeRectShape(this.frameBoxes[i])
                        graphicsGuide.strokeLineShape(new Phaser.Geom.Line(this.frameBoxes[i].right,230,this.frameBoxes[i].right,250))
                    }
                    graphicsGuide.strokeLineShape(new Phaser.Geom.Line(this.frameBoxes[jf.justFrame].right,230,this.frameBoxes[jf.latestFrame].right,230))

                    //JF = Green
                    graphicsGuide.lineStyle(1,0x00ff00)
                    graphicsGuide.fillStyle(0x007700)


                    graphicsGuide.fillRectShape(this.frameBoxes[jf.justFrame])
                    graphicsGuide.strokeRectShape(this.frameBoxes[jf.justFrame])

            //JF bounds and text
            let leftBounds = this.frameBoxes[jf.earlyFrame].left
            let rightBounds = this.frameBoxes[jf.justFrame].right
            graphicsGuide.lineStyle(1,0xffffff)
            
            graphicsGuide.strokeLineShape(new Phaser.Geom.Line(leftBounds,230,rightBounds,230))
            graphicsGuide.strokeLineShape(new Phaser.Geom.Line(leftBounds,230,leftBounds,250))
            graphicsGuide.strokeLineShape(new Phaser.Geom.Line(rightBounds,230,rightBounds,250))

            }   
               
            });

            this.input.on('pointerdown', this.clicked, this);

            //this is for the realtime line - todo, something else - another way...
            this.graphics = this.add.graphics({lineStyle: {width:1,color: 0xff0000}});
            this.frameRuler = new Phaser.Geom.Line(this.startX,320,this.startX,320)
            
            this.scenefps = this.add.bitmapText(this.gameWidth+this.startX,32,'luc','',16).setOrigin(1);
            this.running = this.add.text( 600,50,'Tap or Click when ready',this.largeText).setOrigin()
            
        }


        update(timestep,dt)
        {
            this.scenefps.setText(Phaser.Math.FloorTo(this.sys.game.loop.actualFps,-2).toString()); //seems slow - think i should do it myself. ? How often then?
                  
            if (this.stateRunning ) {
                this.frame++;
                var runtime = this.sys.game.loop.time - this.results.startTime
                if (!this.stateShowResults)
                {
                    if (runtime > this.lastFrame * oneFrame ) {
                        this.stateShowResults = true;
                    }
                    else{
                        let x = this.frameRuler.x2 += this.speed * dt;  
                        this.frameRuler.x2 = x;
                        
                        this.graphics.strokeLineShape(this.frameRuler);  //I want to uses
                    }
                }
                if (runtime > (this.lastFrame + 15) * oneFrame ) {
                    this.stateRunning = false;
                    this.running.setAlpha(1);
                }
                
            }
        }

        showResults() {

        }

        clicked(pointer:Phaser.Input.Pointer) {
            
            let firstClickX = this.startX - 1 + this.frameWidth / 2;
            //stateShowResults is a buffer so late clicks don't cause it to start again.

            if (this.stateRunning && !this.stateShowResults){

                let frame = Phaser.Math.FloorTo(this.results.add(pointer.time),-2)
        
                let dt = pointer.time - this.results.startTime;

                let x = firstClickX + this.speed * dt

                this.graphics.lineStyle(1, 0xffffff);
                this.graphics.fillStyle(0xffffff,0.5)

                let clickCircle = new Phaser.Geom.Circle(x,270,this.frameWidth/2)
                this.graphics.strokeCircleShape(clickCircle)
                this.graphics.fillCircleShape(clickCircle)

                let clickStartLine = new Phaser.Geom.Line(x, 250, x, 330);
                this.graphics.strokeLineShape(clickStartLine);

                
                this.mouseButton.push(this.add.text(x-2,360,
`+${frame}`
                ,this.smallText));
                
            }
            if (!this.stateRunning)
            {
                this.results = null;
              
                this.stateRunning = true;
                this.stateShowResults = false;
                this.mouseButton.forEach(element => { element.destroy() });

                this.results = new resultset(this.sys.game.loop.time,this.justFrameMove.JustFrames)
               
                this.running.setAlpha(0)
                this.frameRuler.x2 = this.startX
                this.graphics.clear()              
                this.graphics.lineStyle(1,0xffffff);

                this.graphics.fillStyle(0xffffff,0.5)
                let clickCircle = new Phaser.Geom.Circle(firstClickX,270,this.frameWidth/2)
                this.graphics.strokeCircleShape(clickCircle)
                this.graphics.fillCircleShape(clickCircle)
                this.graphics.strokeLineShape(new Phaser.Geom.Line(firstClickX,250,firstClickX,330)) //should be halfway through frame... Frame size 6?

                this.frame = 0

            }

        }

    }


    const oneFrame = 16.6666666666666666

    export interface justFrames {
        MoveName: string;
        MoveNotation: string;
        Notes: string;
        JustFrames?: (jfInput)[] | null;
    }
    export interface jfInput {
        id: number;
        move: number;
        earlyFrame: number;
        justFrame: number;
        latestFrame: number;
        optional: boolean;
    }



    declare type buttonPush =
    {
        button?: string
        time: number
        firstFrame?: number
        
        claimedFrame?: number 
        chanceEarly?: number
        chanceOK?: number
        chancePush?: number
        chanceLate?: number
    }
    class  resultset {
        //1. capture the times that taps were made.
        //2. calc which frames they could have hit on and percentages.
        //
        //3. compare with the just frame objects to measure % of success.  - Doing it here.
        
        

        public startTime: number;
        buttons:buttonPush[] = []
        moveFrames:jfInput[] = []
        pushCount: number;
        nextUnclaimed: number = 1;

        constructor(start:number, moves:jfInput[], button:string = "1") {

            this.startTime = start;
            this.buttons.push({time: start, button: button})
            this.moveFrames = moves;
        }

        public add(time:number, button:string = "1") :number {  

            let index = this.buttons.push({time: time,button: button})
            this.calcFrames(this.buttons[index-1])
            return this.buttons[index-1].firstFrame //changed to just show the .frame
        }

        private calcFrames(c:buttonPush): void {

            let timediff = c.time - this.startTime  //eg 19.17/16
            let timeFrame = timediff / oneFrame;   // part through 1st frame. =  1.15
            
            let timeFloor = Math.floor(timeFrame); // actual frame = 1
            let timePerc = timeFrame-timeFloor;    // perc chance next frame.

            let jf:jfInput;
            //  c.percentage = 1-timePerc;

            
            //FEATURE:1 - This will need track and add push frames.
            c.firstFrame = timeFrame
            
            
            // check this button just pushed against all the frames...
            // careful not to double push?  
            // DAMMIT - I'm going to double everything... ? does it matter except the push?
            // What is the point of doing it here???
            // I need to be able to know the push frames
            
            // what I basically want is for button... to know wether it is in the range of a just frame.
            // or for each just frame, wether a button was pushed in it... Is there a difference?
            // maybe for each just frame I should claim the first button in it... 
            
            
            if( this.nextUnclaimed < this.moveFrames.length) {
                jf = this.moveFrames[this.nextUnclaimed]
            
    
                if(c.firstFrame > jf.earlyFrame-1){
                    if (c.firstFrame < jf.latestFrame+1) { 
                    //   1 10 14            34 35 35
                    //14.2 >= 1 <14+1      34.5 
                    
                        if (c.firstFrame > jf.justFrame && jf.latestFrame > jf.justFrame) { //I presume push should always be zero and this is called once...but... can change later if need be.
                            this.pushCount = c.firstFrame - jf.justFrame 
                            if (this.pushCount < 1) c.chancePush = this.pushCount // going to push the next frame
                        
                        }
                        if (c.firstFrame < jf.earlyFrame) c.chanceEarly = jf.earlyFrame - c.firstFrame // maybe early                        
      
    
                    }else c.chanceLate=1 // late and clamed = dead.
                    c.claimedFrame = this.nextUnclaimed++; // was on time or late so claimed.
                }else c.chanceEarly=1  // too early - not claimed... ?? maybe change to some other flag...hmmm. but then the next one might be late.

            }//else we done...
        }
    }
}