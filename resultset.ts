module Tappy {

    //buttons captured in resultset
    export interface buttonPush {
        button?: string
        time: number
        firstFrame?: number

        claimedFrame?: number  //this
        chanceOK?: number

        hit1Frame?: number
        hit2Frame?: number
        hit1Chance?: number
        hit2Chance?: number
        jf1Chance?: number
        jf2Chance?: number
    }


    export class resultset {
        //1. capture the times that taps were made.
        //2. calc which frames they could have hit on and percentages.
        //3. compare with the just frame objects to measure % of success.
        public startTime: number;
        buttons: buttonPush[] = []
        moveFrames: jfInput[] = []
        pushCount: number = 0; //at least this much push
        pushFrames: number = 0; // chance of 1 more push
        public nextUnclaimed: number = 1;
        chanceSuccess: number = 0;
        strict: boolean

        constructor(start: number, moves: jfInput[], button: string = "1", strict: boolean = false) {

            this.startTime = start;
            this.buttons.push({ time: start, button: button, firstFrame: 0, claimedFrame: 0, chanceOK: 1 })

            this.moveFrames = moves;
            this.strict = strict
        }

        public add(time: number, button: string = "1") {

            let index = this.buttons.push({ time: time, button: button })
            this.calcFrames(this.buttons[index - 1])
        }

        public getResult(): number {
            if (this.nextUnclaimed < this.moveFrames.length) this.recalcLast()
            let chances: number[] = new Array(this.moveFrames.length)
            
            for (let i = 0; i < chances.length; i++) {
                chances[i] = 0
            }
            this.buttons.forEach(b => {
                if (b.claimedFrame !== null) chances[b.claimedFrame] = b.chanceOK
            });

            return Phaser.Math.FloorTo(chances.reduce(function (product, value) { return product * value }) * 100, -2)

        }
        public recalcLast() {
            //just to stop an early press making chanceOK NaN
            let lastButton = this.buttons.pop()
            if (lastButton.chanceOK == null)  lastButton.chanceOK = 0
            this.buttons.push(lastButton)
        }
        private calcFrames(c: buttonPush): void {
            // designing a new one.
            // 1. create an array of the adjusted Just Frame groups including chances on the ends.
            // 2. match the 1st and 2nd frame chances to the chances of the jfs above
            // 3. record the four chances so they can be displayed.
            // 4. claim the frame.
            // 5. calculate the push count / late / frames
            // 6. get rid of the things I don't need in buttonPush /resultset or calc them too.            
            // TODO
            // 7. not here but display the two chances above/below the frame input.      something like   10%| |90%  hit
            // for later maybe                                                                           100%| |30%  justFrame
            //                                                                                               37%
            // 8. externalise the just frames adjJF into a class that I can update here then reuse for redrawing the main display.

            let jf: jfInput;

            c.firstFrame = (c.time - this.startTime) / oneFrame; // c.firstFrame  
            c.hit1Frame = Math.floor(c.firstFrame)
            c.hit2Frame = c.hit1Frame + 1
            c.hit2Chance = (c.firstFrame - c.hit1Frame)
            c.hit1Chance = 1 - c.hit2Chance

            //c.jf1Chance
            //c.jf2Chance

            if (this.nextUnclaimed < this.moveFrames.length) {

                jf = this.moveFrames[this.nextUnclaimed] // get the next JF we haven't hit yet.

                let adjEarlyFrame = jf.earlyFrame + this.pushCount
                let earlyFrameChance = 1 - (this.pushFrames - this.pushCount)

                let adjLateFrame = jf.latestFrame + this.pushCount
           
                // I think i will create an external class for this...
                let adjJF = [[adjEarlyFrame - 1, 0]]
                adjJF.push([adjEarlyFrame, earlyFrameChance])
                for (let i = adjEarlyFrame + 1 ; i <= adjLateFrame; i++) {
                    adjJF.push([i, 1])
                }
                //if (adjLateFrame>adjEarlyFrame) adjJF.push([adjLateFrame,1-this.latePush]) // Decided I don't want to double up on the late push chance - May chance my mind.
                adjJF.push([adjLateFrame+1, this.pushFrames - this.pushCount]) 
                adjJF.push([adjLateFrame+2, 0])


                if (c.hit2Frame >= adjEarlyFrame) {
                    c.claimedFrame = this.nextUnclaimed++ //late or ok  // todo, once I switch from calcframes1
                    console.log("hit:" + c.hit1Frame)
                    if (c.hit1Frame <= adjLateFrame + 1) {
                        adjJF.forEach(ajf => {
                            console.log(ajf)
                            if (ajf[0] == c.hit1Frame) c.jf1Chance = ajf[1]
                            if (ajf[0] == c.hit2Frame) c.jf2Chance = ajf[1]
                        });
                    }
                    else c.jf1Chance = c.jf2Chance = 0 ; // too late... 

                    c.chanceOK = ((c.hit1Chance*c.jf1Chance)+(c.hit2Chance*c.jf2Chance))
                    
                }
                else { //early
                    // todo when i stop calcframes1
                    //c.chanceEarly=1 // maybe take this out for simplicity.
                    c.jf1Chance = 0
                    c.jf2Chance = 0 
                    c.claimedFrame = this.nextUnclaimed; //claimed next frame but can still be claimed??? - Come back to STRICT
                    
                    if (this.strict) { // strict mode = all buttons must be accounted for.
                        this.nextUnclaimed++
                        c.chanceOK =0
                    }
                    
                }

                // Calculate the pushframes... Happens once only I think...
                // IF so, don't need to use adjusted.
                if (c.firstFrame > jf.justFrame && jf.latestFrame > jf.justFrame) { 
                    this.pushFrames = c.firstFrame - jf.justFrame
                    this.pushCount = Math.floor(this.pushFrames) 
                    if (this.pushFrames > jf.latestFrame - jf.justFrame) {
                        this.pushFrames = this.pushCount = jf.latestFrame - jf.justFrame // max it out, or make it zero.. doesn't really matter
                        
                    }
                }

                
            }
            else this.buttons.pop() // don't need extras

        }

 
    }

}