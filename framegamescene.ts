module Tappy {

    export const oneFrame = 16.6666666666666666
    const gameWidth:number = 1120
    export const mediumText:any = { fontFamily: 'Arial', fontSize: 18, color: '#ffffff' };
    export class FrameGame extends Phaser.Scene {

        constructor() {
            super({key:'FrameGame'});
        }
        //Globals
        smallText:any = { fontFamily: 'Arial', fontSize: 12, color: '#ffffff' };
        largeText:any = { fontFamily: 'Arial', fontSize: 28, color: '#ffffff' };
        startX:number = 40;
        speed:number;

        //moveFrameObject
        justFrameMove:justFrames;
        frameWidth:number;
        lastFrameDisplayed:number;
        pushFrames:number

        //moveDisplay
        frameBoxes:Phaser.Geom.Rectangle[];
        
        //state
        stateRunning:boolean = false;
        stateShowResults:boolean = false;
        stateStartTime:number;        

        //create objects
        frameTick: Phaser.Geom.Line;
    
        graphics:Phaser.GameObjects.Graphics;
        graphicsGuide:Phaser.GameObjects.Graphics;

        //run objects
        sceneTime:Phaser.GameObjects.BitmapText;  
        running:Phaser.GameObjects.Text;          
        resultsText: Phaser.GameObjects.Text[] = [];
        scenefps:Phaser.GameObjects.BitmapText;

        //result objects
        results:resultset

        init(data:justFrames) {
            if (Object.keys(data).length === 0 && data.constructor === Object) {
                console.log("No Data Provided!");
            }
            else{
                this.justFrameMove = <justFrames> data
                console.log(`Loaded from menu: ${this.justFrameMove.MoveName}`)
            } 
        }
        preload() {
            this.load.bitmapFont('luc',['./Fonts/lucidaconsole_0.png','./Fonts/lucidaconsole_1.png'],'./Fonts/lucidaconsole.xml');
            this.load.json('defaultMove','./json/Paul/demoman.json');

            //this.load.json('defaultMove','./json/Lee/acidrain.json');
            //this.load.json('defaultMove','./json/Lee/misttrap.json');
        }
 
        create() {
            this.input.mouse.disableContextMenu();  // allow right-click

            if(this.justFrameMove==null) {                                           //If not called from menu
                this.justFrameMove = <justFrames> this.cache.json.get('defaultMove'); //Default to whatever in preload
                console.log(`Loaded default: ${this.justFrameMove.MoveName}`)
            }
            
            this.pushFrames = 0;
            this.justFrameMove.JustFrames.forEach(f => {
                this.pushFrames += f.latestFrame - f.justFrame
            });

            this.lastFrameDisplayed = this.justFrameMove.JustFrames[this.justFrameMove.JustFrames.length-1].latestFrame + this.pushFrames + 5;
            this.frameWidth = Math.floor(gameWidth / this.lastFrameDisplayed);  //round it into clean frame size
            let cleanGameWidth = this.frameWidth * this.lastFrameDisplayed               //multiply it back into clean gamewidth 
                                                                            // might be a practical minimum size for this. 3 frames probably... 
                                                                            // 3 frames times 60 = 180 + edges...

            this.speed = cleanGameWidth / this.lastFrameDisplayed / oneFrame;        //speed still less accurate probably... only for realtime
        
            this.add.text(this.startX,150,this.justFrameMove.MoveName,mediumText)
            this.add.text(this.startX,170,this.justFrameMove.MoveNotation,mediumText)
            this.add.text(this.startX,190,this.justFrameMove.Notes,mediumText)


            /* Possible features.
            1. to make the effect of push frames clearer.
            */

            this.graphicsGuide = this.add.graphics({lineStyle: {width:1,color: 0xff0000},fillStyle: {color: 0x660000,alpha:1}});
            // make the whole set red.
            this.frameBoxes = []
            for (let i=0;i<=this.lastFrameDisplayed;i++) {
                this.add.text(this.startX + i*this.frameWidth + this.frameWidth/2,290,i.toString(),this.smallText).setOrigin(0.5)
                this.frameBoxes.push(new Phaser.Geom.Rectangle(this.startX + i*this.frameWidth,250,this.frameWidth-2,30))
            }

            this.frameBoxes.forEach(frame => {
                this.graphicsGuide.strokeRectShape(frame);
                this.graphicsGuide.fillRectShape(frame);            
            });


            let localPushCount = 0
            this.justFrameMove.JustFrames.forEach(jf => {
            
                if (!jf.optional) {  // TODO: I think get rid optionals.

                    //draw success boundaries - including blue push frames.
                    this.drawBounds(this.frameBoxes[jf.earlyFrame].left,this.frameBoxes[jf.justFrame].right,230,280,0xffffff)
                    for (let i = 1; i <= localPushCount; i++) {
                        this.drawBounds(this.frameBoxes[jf.earlyFrame+i].left,this.frameBoxes[jf.justFrame+i].right,232,250,0xaa00aa)                         
                    }
        
                    this.add.text(this.startX + jf.justFrame*this.frameWidth +this.frameWidth/2,240,jf.move.toString(),this.smallText).setOrigin(0.5)  

                    //early or JF= green
                    this.graphicsGuide.lineStyle(1,0x00ff00)
                    this.graphicsGuide.fillStyle(0x007700)

                    for (let i = jf.earlyFrame; i <= jf.justFrame; i++) {
                        this.graphicsGuide.fillRectShape(this.frameBoxes[i])
                        this.graphicsGuide.strokeRectShape(this.frameBoxes[i])
                    }

                    //late = blue
                    this.graphicsGuide.lineStyle(1,0x0000ff)
                    this.graphicsGuide.fillStyle(0x000077)
                    for ( let i = jf.justFrame+1; i<= jf.latestFrame; i++) {
                        this.graphicsGuide.fillRectShape(this.frameBoxes[i])
                        this.graphicsGuide.strokeRectShape(this.frameBoxes[i])
                        this.graphicsGuide.strokeLineShape(new Phaser.Geom.Line(this.frameBoxes[i].right,230,this.frameBoxes[i].right,250))
                        localPushCount++; // Again assuming only one push frames... 
                    }
                    this.graphicsGuide.strokeLineShape(new Phaser.Geom.Line(this.frameBoxes[jf.justFrame].right,230,this.frameBoxes[jf.latestFrame].right,230))

                    /*//JF = Green //
                    this.graphicsGuide.lineStyle(1,0x00ff00)
                    this.graphicsGuide.fillStyle(0x007700) 
                    this.graphicsGuide.fillRectShape(this.frameBoxes[jf.justFrame])
                    this.graphicsGuide.strokeRectShape(this.frameBoxes[jf.justFrame])
                    */

            }   
               
            });
            this.graphics = this.add.graphics({lineStyle: {width:1,color: 0xff0000}});//now just for the circles.
            
            this.scenefps = this.add.bitmapText(cleanGameWidth+this.startX,32,'luc','',16).setOrigin(1);
            this.running = this.add.text( 600,50,'Tap or Click when ready',this.largeText).setOrigin()

            //set up input handdlers: // TODO add keyboard
            this.input.on('pointerdown', this.clicked, this);
            this.input.gamepad.on('down',this.pressed, this);           

            console.log(`width: ${cleanGameWidth} sX: ${this.startX}`)
            this.add.text(cleanGameWidth+this.startX,40,'MENU',mediumText).setInteractive().on('pointerdown',(p,x,y,ed:Phaser.Input.EventData) => {
                ed.stopPropagation()
                //this.graphics.clear() //maybe not.
                //this.graphicsGuide.clear() //maybe not.
                this.scene.start('MenuScene')
            })            
        }

        drawBounds(x1:number,x2:number,y1:number,y2:number,colour:number){
            let gDraw = this.add.graphics({lineStyle: {width:1,color: colour}})
                    
            gDraw.strokeLineShape(new Phaser.Geom.Line(x1,y1,x2,y1))
            gDraw.strokeLineShape(new Phaser.Geom.Line(x1,y1,x1,y2))
            gDraw.strokeLineShape(new Phaser.Geom.Line(x2,y1,x2,y2))            

        }
        


        update(timestep,dt){
        
            this.scenefps.setText(Phaser.Math.FloorTo(this.sys.game.loop.actualFps,-2).toString()); //seems slow - think i should do it myself. ? How often then?
                  
            if (this.stateRunning ) {
                var runtime = this.sys.game.loop.time - this.results.startTime
                if (!this.stateShowResults)
                {
                    if (runtime > this.lastFrameDisplayed * oneFrame ) {
                        this.stateShowResults = true;
                    }
                }
                if (runtime > (this.lastFrameDisplayed + 15) * oneFrame ) {
                    this.stateRunning = false;
                    this.drawResults()
                }
                
            }
        }


        pressed(pad:Phaser.Input.Gamepad.Gamepad,button:Phaser.Input.Gamepad.Button)
        {
            //needs input.queue in phaser 3.16 but timestamp still doesn't update so
            //input queue also stops the mid frame timestamp. 
            
            if (button.index < 4 ) {
                this.tapUpdate(this.sys.game.loop.time,button.index)
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

                this.results.add(time,button.toString())
        
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
                this.resultsText.forEach(element => { element.destroy() });

                this.results = new resultset(this.sys.game.loop.time,this.justFrameMove.JustFrames)
               
                this.running.setAlpha(0)
                this.graphics.clear()              
                this.graphics.lineStyle(1,0xffffff);
                this.graphics.fillStyle(0xffffff,0.5)
                let clickCircle = new Phaser.Geom.Circle(firstClickX,265,this.frameWidth/2)
                this.graphics.strokeCircleShape(clickCircle)
                this.graphics.fillCircleShape(clickCircle)
                this.graphics.strokeLineShape(new Phaser.Geom.Line(firstClickX,250,firstClickX,350)) //should be halfway through frame... Frame size 6?

            }
        }

        drawResults() {
            //if (this.results.nextUnclaimed < this.justFrameMove.JustFrames.length) this.results.recalcLast() //fix up ignored if not all are claimed //

            let firstClickX = this.startX - 1 + this.frameWidth / 2;
            
            this.results.buttons.forEach(b => {
                let y = 340 
                let dt = b.time - this.results.startTime;
                let x = firstClickX + this.speed * dt
                let style = Object.create(this.smallText)
                
                
                //Draw stuff

                this.resultsText.push(this.add.text(x+2,315,`${Phaser.Math.FloorTo(b.firstFrame,-2)}`,this.smallText));


                style.color = getColorFromPercent(b.chanceOK);

                let claim:string
               
                if (b.chanceEarly == 1 || b.claimedFrame == null){
                    style.color = '#777777' // grey 
                    y += 120
                    claim = 'n/a'
                }
                else claim = b.claimedFrame.toString()
                

                //notes
                let clickStartLine = new Phaser.Geom.Line(x, 300, x, y+120);
                this.graphics.strokeLineShape(clickStartLine);
                this.resultsText.push(this.add.text(x+2,y,
`Button:${b.button}
Early %:${Phaser.Math.FloorTo(b.chanceEarly,-4)}
Late %: ${Phaser.Math.FloorTo(b.chanceLate,-4)}
Push %: ${Phaser.Math.FloorTo(b.chancePush,-4)}
PCount: ${this.results.pushCount}
1st %:  ${Phaser.Math.FloorTo(b.chanceFirst,-4)}
OK%:    ${Phaser.Math.FloorTo(b.chanceOK*100,-2)}
JustF:  ${claim}`                        
                ,style))
                
                
            });
        
        let successResult = this.results.getResult() //final result
        this.running.setText(`${successResult}% success - Tap to try again`)
        this.running.setColor(getColorFromPercent(successResult/100))
        this.running.setAlpha(1)
        }

    }
    

    function getColorFromPercent(chance: number) :string{ //chance = 0-1
        let colour: Phaser.Display.Color = new Phaser.Display.Color().setFromHSV(chance * .3, 1, 1);
        return Phaser.Display.Color.RGBToString(colour.red, colour.green, colour.blue, colour.alpha, '#');
    }
}