module Tappy {

    export const oneFrame = 16.6666666666666666
    const gameWidth: number = 1100
    export const mediumText: any = { fontFamily: 'Arial', fontSize: 18, color: '#ffffff' };
    export class FrameGame extends Phaser.Scene {

        constructor() {
            super({ key: 'FrameGame' });
        }
        //Globals
        smallText: any = { fontFamily: 'Arial', fontSize: 12, color: '#ffffff' };
        largeText: any = { fontFamily: 'Arial', fontSize: 28, color: '#ffffff' };
        startX: number = 40;
        moveTextY: number = 150;
        frameGuideY: number = 230;
        frameBoxY: number = 250;
        frameBoxHeight: number = 30
        ySpace: number = 5
        yPush: number;
        speed: number;

        //moveFrameObject
        justFrameMove: justFrames;
        frameWidth: number;
        lastFrameDisplayed: number;
        pushFrames: number

        //moveDisplay
        frameBoxes: any[][];

        //state
        stateRunning: boolean = false;
        stateShowResults: boolean = false;
        stateStartTime: number;
        strict: boolean = false;

        //create objects
        frameTick: Phaser.Geom.Line;

        graphics: Phaser.GameObjects.Graphics;
        graphicsGuide: Phaser.GameObjects.Graphics;

        //run objects
        sceneTime: Phaser.GameObjects.BitmapText;
        running: Phaser.GameObjects.Text;
        resultsText: Phaser.GameObjects.Text[] = [];
        scenefps: Phaser.GameObjects.BitmapText;

        //result objects
        results: resultset

        init(data: justFrames) {
            if (Object.keys(data).length === 0 && data.constructor === Object) {
                console.log("No Data Provided!");
            }
            else {
                this.justFrameMove = <justFrames>data
                this.strict = this.justFrameMove.DefaultStrict
                console.log(`Loaded from menu: ${this.justFrameMove.MoveName}`)
            }
        }
        preload() {
            this.load.bitmapFont('luc', ['./Fonts/lucidaconsole_0.png', './Fonts/lucidaconsole_1.png'], './Fonts/lucidaconsole.xml');
            this.load.json('defaultMove', './movesjson/default.json');

        }

        create() {
            if (this.justFrameMove == null) {                                           //If not called from menu
                this.justFrameMove = <justFrames>this.cache.json.get('defaultMove'); //Default to whatever in preload
                console.log(`Loaded default: ${this.justFrameMove.MoveName}`)
            }

            this.pushFrames = 0;
            this.justFrameMove.JustFrames.forEach(f => {
                this.pushFrames += f.latestFrame - f.justFrame
            });

            
            var jfLastFrame = this.justFrameMove.JustFrames[this.justFrameMove.JustFrames.length - 1]

            this.lastFrameDisplayed = jfLastFrame.latestFrame  + this.pushFrames + 2;
            if (jfLastFrame.mehLate != null ) this.lastFrameDisplayed += (jfLastFrame.mehLate > jfLastFrame.latestFrame) ?  jfLastFrame.mehLate - jfLastFrame.latestFrame: 0

           

            this.frameWidth = Math.floor(gameWidth / this.lastFrameDisplayed);  //round it into clean frame size
            let cleanGameWidth = this.frameWidth * this.lastFrameDisplayed               //multiply it back into clean gamewidth 
            // might be a practical minimum size for this. 3 frames probably... 
            // 3 frames times 60 = 180 + edges...

            this.speed = cleanGameWidth / this.lastFrameDisplayed / oneFrame;        //speed still less accurate probably... only for realtime


            this.add.text(this.startX, this.moveTextY, this.justFrameMove.MoveName, mediumText)
            this.add.text(this.startX, this.moveTextY+20, this.justFrameMove.MoveNotation, mediumText)
            this.add.text(this.startX, this.moveTextY+40, this.justFrameMove.Notes, mediumText)


            /* Possible features.
            1. to make the effect of push frames clearer.
            */

            this.graphicsGuide = this.add.graphics({ lineStyle: { width: 1, color: 0xff0000 }, fillStyle: { color: 0x660000, alpha: 1 } });
            // make the whole set red.
            
            this.graphicsGuide.strokeRect(0,0,1200,600)//debug, show gamesize
            this.frameBoxes = []
             for (let i = 0; i<=this.pushFrames; i++){
                this.frameBoxes[i] = []
            }

            this.yPush = 0 
            for (let p = 0; p <= this.pushFrames; p++)   
            {
                this.graphicsGuide.lineStyle(1, 0xff0000 )
                this.graphicsGuide.fillStyle(0x660000)

                
                let h = this.frameBoxHeight
                if (p>0){ 
                    h = this.frameBoxHeight / 3
                }
                

                for (let i = 0; i <= this.lastFrameDisplayed; i++) {
                    
                    this.frameBoxes[p].push(new Phaser.Geom.Rectangle(this.startX + i * this.frameWidth, this.frameBoxY + this.yPush, this.frameWidth - 2, h))
                }

                this.frameBoxes[p].forEach(frame => {
                    this.graphicsGuide.strokeRectShape(frame);
                    this.graphicsGuide.fillRectShape(frame);
                });
                
                let localPushCount = 0
                this.justFrameMove.JustFrames.forEach(jf => {

                    if (!jf.optional) {  // TODO: I think get rid optionals - nah, maybe come back to it.
                        //draw meh frames
                        if (jf.mehEarly != null) {
                            //this.drawBounds(this.frameBoxes[jf.mehEarly].left, this.frameBoxes[jf.mehLate].right, 230,280,0xFFA500)
                            this.graphicsGuide.lineStyle(1, 0xFFA500)
                            this.graphicsGuide.fillStyle(0xFFA500)
                                for (let i = jf.mehEarly; i <= jf.mehLate; i++) {
                                this.graphicsGuide.fillRectShape(this.frameBoxes[p][i+localPushCount])
                                //this.graphicsGuide.strokeRectShape(this.frameBoxes[i])
                            }
            
                        }

                        //early or JF= green
                        this.graphicsGuide.lineStyle(1, 0x00ff00)
                        this.graphicsGuide.fillStyle(0x007700)

                        for (let i = jf.earlyFrame; i <= jf.justFrame; i++) {
                            this.graphicsGuide.fillRectShape(this.frameBoxes[p][i+localPushCount])
                            this.graphicsGuide.strokeRectShape(this.frameBoxes[p][i+localPushCount])
                        }

                        //late = blue
                        this.graphicsGuide.lineStyle(1, 0x0000ff)
                        this.graphicsGuide.fillStyle(0x000077)
                        for (let i = jf.justFrame + 1; i <= jf.latestFrame - this.pushFrames + p; i++) {
                            this.graphicsGuide.fillRectShape(this.frameBoxes[p][i])
                            this.graphicsGuide.strokeRectShape(this.frameBoxes[p][i])
                            this.graphicsGuide.strokeLineShape(new Phaser.Geom.Line(this.frameBoxes[p][i].right, this.frameGuideY, this.frameBoxes[p][i].right, this.frameBoxY))
                            localPushCount++; // Again assuming only one push frames... 
                        }
                        this.graphicsGuide.strokeLineShape(new Phaser.Geom.Line(this.frameBoxes[p][jf.justFrame].right, this.frameGuideY, this.frameBoxes[p][jf.latestFrame].right, this.frameGuideY))
                    }

                });
                this.yPush += h + this.ySpace
            }

            for (let i = 0; i <= this.lastFrameDisplayed; i++) {
                this.add.text(this.startX + i * this.frameWidth + this.frameWidth / 2, this.frameBoxY +this.ySpace+ this.yPush, i.toString(), this.smallText).setOrigin(0.5);
            }
            
            this.justFrameMove.JustFrames.forEach(jf => {
                this.drawBounds(this.frameBoxes[0][jf.earlyFrame].left, this.frameBoxes[0][jf.justFrame].right, 230, 280, 0xffffff);
                this.add.text(this.startX + jf.justFrame * this.frameWidth + this.frameWidth / 2, this.frameGuideY + 10, jf.move.toString(), this.smallText).setOrigin(0.5);
            })

            this.graphics = this.add.graphics({ lineStyle: { width: 1, color: 0xff0000 } });//now just for the circles.

            this.scenefps = this.add.bitmapText(cleanGameWidth + this.startX, 32, 'luc', '', 16).setOrigin(1);
            this.running = this.add.text(600, 50, 'Tap or Click when ready', this.largeText).setOrigin()

            //set up input handdlers: // TODO add keyboard
            this.input.on('pointerdown', this.clicked, this);
            this.input.on('pointerdownoutside',this.clicked, this)
            this.input.gamepad.on('down', this.pressed, this);

            console.log(`width: ${cleanGameWidth} sX: ${this.startX}`)

            let strictText =  (this.strict)?"STRICT MODE ON":"STRICT MODE OFF"
            this.add.text(this.startX, 100, strictText, mediumText).setInteractive().on('pointerdown', function (p, x, y, ed: Phaser.Input.EventData) {
                ed.stopPropagation()
                this.scene.strict = !this.scene.strict // this shouldn't work??
                this.text = (this.scene.strict)?"STRICT MODE ON":"STRICT MODE OFF"

            }
                
)
            this.add.text(cleanGameWidth + this.startX, 40, 'MENU', mediumText).setInteractive().on('pointerdown', function(p, x, y, ed: Phaser.Input.EventData) {
                ed.stopPropagation()
                //this.graphics.clear() //maybe not.
                //this.graphicsGuide.clear() //maybe not.
                this.scene.scene.start('MenuScene')
            })
        }

        drawBounds(x1: number, x2: number, y1: number, y2: number, colour: number) {
            let gDraw = this.add.graphics({ lineStyle: { width: 1, color: colour } })

            gDraw.strokeLineShape(new Phaser.Geom.Line(x1, y1, x2, y1))
            gDraw.strokeLineShape(new Phaser.Geom.Line(x1, y1, x1, y2))
            gDraw.strokeLineShape(new Phaser.Geom.Line(x2, y1, x2, y2))

        }



        update(timestep, dt) {

            this.scenefps.setText(Phaser.Math.FloorTo(this.sys.game.loop.actualFps, -2).toString()); //seems slow - think i should do it myself. ? How often then?

            if (this.stateRunning) {
                var runtime = this.sys.game.loop.time - this.results.startTime
                if (!this.stateShowResults) {
                    if (runtime > this.lastFrameDisplayed * oneFrame) {
                        this.stateShowResults = true;
                    }
                }
                if (runtime > (this.lastFrameDisplayed + 15) * oneFrame) {
                    this.stateRunning = false;
                    this.drawResults()
                }

            }
        }


        pressed(pad: Phaser.Input.Gamepad.Gamepad, button: Phaser.Input.Gamepad.Button) {
            //LOOKS LIKE THIS IS BEING READ ONCE A FRAME... NEED MORE.
            if (this.justFrameMove.DirectionsOK || button.index < 4) {
                this.tapUpdate(this.sys.game.loop.time, button.index)
            }

        }

        clicked(pointer: Phaser.Input.Pointer) {

            this.tapUpdate(pointer.time, pointer.buttons) //one day make sure pointer.time is the same as sys.game.loop.time... OR a better time hasn't been added to the others.
        }

        tapUpdate(time: number, button: number) {
            let firstClickX = this.startX - 1;
            
            if (this.stateRunning && !this.stateShowResults) { //stateShowResults is a buffer so late clicks don't cause it to start again.

                this.results.add(time, button.toString())

                let dt = time - this.results.startTime;
                let x = firstClickX + this.speed * dt

                let yTop = this.frameBoxY
                let yBottom = this.frameBoxHeight

                if (this.results.pushCount>0){
                    yTop += this.frameBoxHeight + this.ySpace + (this.frameBoxHeight/3 + this.ySpace)*(this.results.pushCount-1)
                    yBottom = this.frameBoxHeight /3
                }
                if (this.results.pushFrames>0 && this.results.pushCount < this.results.pushMax){
                    yBottom += (this.frameBoxHeight/3 + this.ySpace) 
                }

                this.graphics.lineStyle(1, 0xffffff);
                this.graphics.fillStyle(0xffffff, 0.5)
                
                let clickRect = new Phaser.Geom.Rectangle(x,yTop,this.frameWidth,yBottom)
                //let clickCircle = new Phaser.Geom.Circle(x, yBottom, this.frameWidth / 2)
                //this.graphics.strokeCircleShape(clickCircle)
                //this.graphics.fillCircleShape(clickCircle)
                this.graphics.strokeRectShape(clickRect)
                this.graphics.fillRectShape(clickRect)

                
            }
            if (!this.stateRunning) {
                this.results = null;

                this.stateRunning = true;
                this.stateShowResults = false;
                this.resultsText.forEach(element => { element.destroy() });

                this.results = new resultset(this.sys.game.loop.time, this.justFrameMove.JustFrames,button.toString(),this.strict,this.pushFrames )

                this.running.setAlpha(0)
                this.graphics.clear()
                //this.graphics.lineStyle(1, 0xffffff);
                //this.graphics.fillStyle(0xffffff, 0.5)
                //let clickCircle = new Phaser.Geom.Circle(firstClickX, 265, this.frameWidth / 2)
                //this.graphics.strokeCircleShape(clickCircle)
                //this.graphics.fillCircleShape(clickCircle)
                //this.graphics.strokeLineShape(new Phaser.Geom.Line(firstClickX, 250, firstClickX, 350)) //should be halfway through frame...

            }
        }

        drawResults() {
            //if (this.results.nextUnclaimed < this.justFrameMove.JustFrames.length) this.results.recalcLast() //fix up ignored if not all are claimed //
            let successResult = this.results.getResult() //final result

            let firstClickX = this.startX - 1 + this.frameWidth / 2;

            this.results.buttons.forEach(b => {
                let y = this.frameBoxY + this.frameBoxHeight + this.ySpace + this.yPush
                let dt = b.time - this.results.startTime;
                let x = firstClickX + this.speed * dt
                let style = Object.create(this.smallText)


                //Draw stuff

                this.resultsText.push(this.add.text(x-this.frameWidth/2, y -20, `${Phaser.Math.RoundTo(b.firstFrame, -3)}`, this.smallText));


                style.color = getColorFromPercent(b.chanceOK);

                let claim: string

                if (b.chanceOK == null || b.claimedFrame == null) {
                    style.color = '#777777' // grey 
                    //y += 120
                    claim = 'n/a'
                }
                else claim = b.claimedFrame.toString()


                //notes
                let clickStartLine = new Phaser.Geom.Line(x, y, x, y + 120);
                this.graphics.strokeLineShape(clickStartLine);
                this.resultsText.push(this.add.text(x + 2, y,
`${Phaser.Math.FloorTo(b.hit2Frame,-2)}
${Phaser.Math.FloorTo(b.jf2Chance * 100,-2)}% Just

Button:${b.button}
PFrames:${Phaser.Math.FloorTo(this.results.pushFrames, -4)}
PCount: ${this.results.pushCount}
OK%:    ${Phaser.Math.FloorTo(b.chanceOK * 100, -2)}
JustF:  ${claim}`, style))
                
                this.resultsText.push(this.add.text(x-2,y,
`${Phaser.Math.FloorTo(b.hit1Frame,-2)}
Just ${Phaser.Math.FloorTo(b.jf1Chance * 100,-2)}%`,style).setOrigin(1,0).setAlign('right'))
            });


            this.running.setText(`${successResult}% success - Tap to try again`)
            this.running.setColor(getColorFromPercent(successResult / 100))
            this.running.setAlpha(1)
        }

    }


    function getColorFromPercent(chance: number): string { //chance = 0-1
        let colour: Phaser.Display.Color = new Phaser.Display.Color().setFromHSV(chance * .3, 1, 1);
        return Phaser.Display.Color.RGBToString(colour.red, colour.green, colour.blue, colour.alpha, '#');
    }

}