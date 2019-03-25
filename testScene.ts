module Tappy {

    const oneFrame = 16.6666666666666666
    
    export class TestScene extends Phaser.Scene {

        constructor() {
            super({key:'TestScene'});
        }
        //Globals
        smallText:any = { fontFamily: 'Arial', fontSize: 12, color: '#ffffff' };
        mediumText:any = { fontFamily: 'Arial', fontSize: 18, color: '#ffffff' };
        largeText:any = { fontFamily: 'Arial', fontSize: 28, color: '#ffffff' };
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
            //this.load.json('moveFrames','./json/Lee/misttrap.json');
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


            /* Possible features.
            1. to make the effect of push frames clearer.
            2. to show which buttons are for when
            4. recommended frames???
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

                if (!jf.optional) {  // TODO: I think get rid optionals.

        
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

            this.input.gamepad.on('down',this.pressed, this);            //this is for the realtime line - todo, something else - another way...
            
            this.graphics = this.add.graphics({lineStyle: {width:1,color: 0xff0000}});
            this.frameRuler = new Phaser.Geom.Line(this.startX,300,this.startX,300)
            
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
                    this.drawResults()
                }
                
            }
        }


        pressed(pad:Phaser.Input.Gamepad.Gamepad,button:Phaser.Input.Gamepad.Button)
        {
            console.log(`tap ${pad.timestamp}`) //bug1: timestamp not working for some reason, previously fixed with input.queue, but stopped.
            if (button.index < 4 ) {
                this.tapUpdate(pad.timestamp,button.index)
            }
            
        }

        clicked(pointer:Phaser.Input.Pointer) {
            
            this.tapUpdate(pointer.time,pointer.buttons)

        }

        tapUpdate(time:number,button:number)
        {
            let firstClickX = this.startX - 1 + this.frameWidth / 2;
            //stateShowResults is a buffer so late clicks don't cause it to start again.

            if (this.stateRunning && !this.stateShowResults){

                this.results.add(time)
        
                let dt = time - this.results.startTime;

                let x = firstClickX + this.speed * dt

                this.graphics.lineStyle(1, 0xffffff);
                this.graphics.fillStyle(0xffffff,0.5)

                let clickCircle = new Phaser.Geom.Circle(x,265,this.frameWidth/2)
                this.graphics.strokeCircleShape(clickCircle)
                this.graphics.fillCircleShape(clickCircle)

                let clickStartLine = new Phaser.Geom.Line(x, 250, x, 300);
                this.graphics.strokeLineShape(clickStartLine);  
                
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
                let clickCircle = new Phaser.Geom.Circle(firstClickX,265,this.frameWidth/2)
                this.graphics.strokeCircleShape(clickCircle)
                this.graphics.fillCircleShape(clickCircle)
                this.graphics.strokeLineShape(new Phaser.Geom.Line(firstClickX,250,firstClickX,350)) //should be halfway through frame... Frame size 6?

                this.frame = 0

            }
        }

        drawResults() {
            //if (this.results.nextUnclaimed < this.justFrameMove.JustFrames.length) this.results.recalcLast() //fix up ignored if not all are claimed //

            let firstClickX = this.startX - 1 + this.frameWidth / 2;
            let successCheck: number [] = new Array(this.justFrameMove.JustFrames.length)
            successCheck[0] = 1 /// Should really treat the first frame properly in the resultset...
            
            this.results.buttons.forEach(b => {
                let y = 340 
                let dt = b.time - this.results.startTime;
                let x = firstClickX + this.speed * dt
                let style = Object.create(this.smallText)
                
                if (b.claimedFrame) {
                    //Calculate success.
                    successCheck[b.claimedFrame] = (1-b.chanceEarly) * (1-b.chanceLate)

                    //Draw stuff
                    this.mouseButton.push(this.add.text(x+2,315,
                        `${Phaser.Math.FloorTo(b.firstFrame,-2)}`
                    ,this.smallText));

                    let c = b.claimedFrame.toString()

                    if (b.chanceLate == 1){
                        style.color = '#ff0000' //red
                    }
                    else if (b.chanceEarly == 1){
                        style.color = '#777777'
                        y += 75
                        c = 'ignored'
                    }
                    else if (b.chanceEarly == 0 && b.chanceLate == 0) {
                        style.color = '#00ff00' //green
                    }
                    else  {
                        style.color = '#ffff00' //yellow
                    }
                    
                    //draw stuff
                    let clickStartLine = new Phaser.Geom.Line(x, 300, x, y+75);
                    this.graphics.strokeLineShape(clickStartLine);
                    this.mouseButton.push(this.add.text(x+2,y,
`Button: ${b.button}
Early %: ${Phaser.Math.FloorTo(b.chanceEarly,-4)}
Late %: ${Phaser.Math.FloorTo(b.chanceLate,-4)}
Pushframes: ${Phaser.Math.FloorTo(b.chancePush,-4)}
Frame: ${c}`                        
                        ,style))
                }
                else {//may be all claimed now.
                    /*style.color ='#666666'
                    this.mouseButton.push(this.add.text(x+2, y+70, 
`Button: ${b.button}
n/a`
,style)) */  // First and any after last...
                }

            });

        //Calculate result
        let successResult = Phaser.Math.FloorTo(successCheck.reduce(function(product,value){return product*value}) *100,-2)
        
        this.running.setText(`${successResult}% success - Tap to try again`)
        this.running.setAlpha(1)
        }

    }




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


// Should I do a proper class instead of this weird optional set.?
    declare type buttonPush =
    {
        button?: string
        time: number
        firstFrame?: number     
        
        claimedFrame?: number //this
        chanceEarly?: number  //this
        chanceOK?: number
        chancePush?: number 
        chanceLate?: number   //this
    }
    class  resultset {
        //1. capture the times that taps were made.
        //2. calc which frames they could have hit on and percentages.
        //
        //3. compare with the just frame objects to measure % of success.  - Doing it here.
        public startTime: number;
        buttons:buttonPush[] = []
        moveFrames:jfInput[] = []
        pushCount: number = 0;
        pushFrames: number = 0;
        public nextUnclaimed: number = 1;

        constructor(start:number, moves:jfInput[], button:string = "1") {

            this.startTime = start;
            this.buttons.push({time: start, button: button})
            this.moveFrames = moves;
        }

        public add(time:number, button:string = "1") {  

            let index = this.buttons.push({time: time,button: button})
            this.calcFrames(this.buttons[index-1])
        }
        
        public recalcLast() {
            
            // find the last claim then go forwards.
            
            // TODO: but it doesn really work how I want... should show early then push the next one out as well.
            // two situations: 1: I have hit the 3rd but early for 4th... this works now.
            //                 2: I have missed both the 3rd and 4th - this doesn't because I find the 4th as a late.
            //                    Ideally the 3rd and 4th would now show as early..
            //                 3: What if I add a 3rd actual early, then 4 and 5 should match to 3 and 4. but they are early / late too.  Ugly. Maybe I should just get all the closest misses.
            //                 4: what if I hit 1,2,3 but do a 4 and 5 on either side... I should just do them grey but show the numbers
            // If I can tell the difference - I can fix it
            // Dont worry about this... Next Calc the total chance ..

            let lastClaim = 0 // what if I only click once?
            for (let i = 0; i < this.buttons.length; i++) {
                if (this.buttons[i].claimedFrame) lastClaim = i
            }
            lastClaim++;

            while (lastClaim < this.buttons.length){  // this is dumb... It will only ever calc the last one anyway - unless they were both before the 3rd.
                this.calcFrames(this.buttons[lastClaim], true)
                lastClaim++
            }
        }

        private calcFrames(c:buttonPush, redo:boolean =true): void {

            let timediff = c.time - this.startTime  //eg 19.17/16
            let timeFrame = timediff / oneFrame;   // part through 1st frame. =  1.15
            
            let timeFloor = Math.floor(timeFrame); // actual frame = 1
            let timePerc = timeFrame-timeFloor;    // perc chance next frame.

            let jf:jfInput;
            //  c.percentage = 1-timePerc;

            
            //FEATURE:1 - This will need track and add push frames.
            c.firstFrame = timeFrame
            // careful not to double push?  
            // Q: What is the point of doing it here??? A: I need to be able to know the push frames
            // for each just frame I should claim the first button in it... 
            if( this.nextUnclaimed < this.moveFrames.length) {
                jf = this.moveFrames[this.nextUnclaimed]
            
                c.chanceEarly = c.chanceLate = 0;
                if(c.firstFrame > this.pushCount + jf.earlyFrame-1){
                    //at least partially in on early side
                    if (c.firstFrame < this.pushCount + jf.latestFrame+1) { 
                        //at least partially in on late side
                        
                        if (c.firstFrame < jf.earlyFrame + Math.floor(this.pushCount)) c.chanceEarly = jf.earlyFrame + this.pushCount - c.firstFrame // maybe early  
                            //Wrong.. need to multiply not add percentage. but multiple frames needs to be thought about
                        if (c.firstFrame > jf.latestFrame + this.pushCount) c.chanceLate = c.firstFrame - (jf.latestFrame + this.pushCount) // mayber late
                                        
                        if (c.firstFrame > jf.justFrame && jf.latestFrame > jf.justFrame) { //I presume push should always be zero and this is called once...but... can change later if need be.
                            this.pushFrames = c.firstFrame - jf.justFrame
                            this.pushCount = Math.floor(this.pushFrames) //only guarenteed frames.
                        }
                    }else c.chanceLate=1 // late and clamed = dead.
                    c.claimedFrame = this.nextUnclaimed++; // was on time or late so claimed.
                    c.chancePush = this.pushFrames // not sure if I need this...
                }else {
                    c.chanceEarly=1  //trying to fix situations where not enough presses. or not enough matches.  
                    if (redo) { // maybe I could always do this but just not increment...????
                        c.claimedFrame = this.nextUnclaimed;
                        c.chancePush = this.pushFrames;
                    }
                }
            }//else we done...
        }
    }
}