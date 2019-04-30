module Tappy {

    //buttons captured in resultset
    export interface buttonPush {
        button?: string
        time: number
        firstFrame?: number

        claimedFrame?: number  //this
        chanceEarly?: number  //this
        chanceFirst?: number
        chancePush?: number
        chanceLate?: number   //this
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
        latePush: number = 0; // maybe a missed push.
        public nextUnclaimed: number = 1;
        chanceSuccess: number = 0;

        constructor(start: number, moves: jfInput[], button: string = "1") {

            this.startTime = start;
            this.buttons.push({ time: start, button: button, firstFrame: 0, claimedFrame: 0, chanceEarly: 0, chanceFirst: 0, chanceLate: 0, chancePush: 0, chanceOK: 1 })

            this.moveFrames = moves;
        }

        public add(time: number, button: string = "1") {

            let index = this.buttons.push({ time: time, button: button })
            this.calcFrames(this.buttons[index - 1])
        }

        public getResult(): number {
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
            let lastClaim = 0 // what if I only click once?
            for (let i = 0; i < this.buttons.length; i++) {
                if (this.buttons[i].claimedFrame) lastClaim = i
            }
            lastClaim++;

            while (lastClaim < this.buttons.length) {  // this is dumb... It will only ever calc the last one anyway - unless they were both before the 3rd.
                this.calcFrames(this.buttons[lastClaim], true)
                lastClaim++
            }
        }
        private calcFrames2(c: buttonPush, redo: boolean = true): void {
            // designing a new one.
            // 1. create an array of the adjusted Just Frame groups including chances on the ends.
            // 2. match the 1st and 2nd frame chances to the chances of the jfs above
            // 3. record the four chances so they can be displayed.
            // todo
            // 4. claim the frame.
            // 5. calculate the push count / late / frames
            // 6. get rid of the things I don't need in buttonPush /resultset or calc them too.              | |
            // 7. not here but display the two chances above/below the frame input.      something like   10%| |90%  hit
            // for later maybe                                                                           100%| |30%  justFrame
            //                                                                                               37%
            // 8. externalise the just frames adjJF into a class that I can update here then reuse for redrawing the main display.

            let jf: jfInput;

            let firstFrame = (c.time - this.startTime) / oneFrame; // c.firstFrame  
            c.hit1Frame = Math.floor(firstFrame)
            c.hit2Frame = c.hit1Frame + 1
            c.hit2Chance = (firstFrame - c.hit1Frame)
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
                //if (adjLateFrame>adjEarlyFrame) adjJF.push([adjLateFrame,1-this.latePush]) // Decided I don't want this - May chance my mind.
                adjJF.push([adjLateFrame+1, this.pushFrames - this.pushCount]) 
                adjJF.push([adjLateFrame+2, 0])


                if (c.hit2Frame >= adjEarlyFrame) {
                    //c.claimedFrame = this.nextUnclaimed++ //late or ok  // todo, once I switch from calcframes1
                    console.log("hit:" + c.hit1Frame)
                    if (c.hit1Frame <= adjLateFrame + 1) {
                        adjJF.forEach(ajf => {
                            console.log(ajf)
                            if (ajf[0] == c.hit1Frame) c.jf1Chance = ajf[1]
                            if (ajf[0] == c.hit2Frame) c.jf2Chance = ajf[1]
                        });
                    }

                    let chanceOK = ((c.hit1Chance*c.jf1Chance)+(c.hit2Chance*c.jf2Chance))
                    console.log(chanceOK)
                }
                else { //early
                    // todo when i stop calcframes1
                    // c.chanceEarly=1 // maybe take this out for simplicity.
                    // c.claimedFrame = this.nextUnclaimed; //claimed next frame but can still be claimed??? - Come back to STRICT
                }

                
            }

        }

        private calcFrames(c: buttonPush, redo: boolean = true): void {
            this.calcFrames2(c)
            let timediff = c.time - this.startTime  //eg 19.17/16
            let timeFrame = timediff / oneFrame;   // part through 1st frame. =  1.15

            let jf: jfInput;

            //I think this is pretty good now.
            //If I do a rewrite for the display.. split okay by frame. i.e 1st frame ok = 10% 2nd frame 0% ok. then multiply by chance of hitting it.
            c.chanceOK = 0
            c.firstFrame = timeFrame
            if (this.nextUnclaimed < this.moveFrames.length) {
                jf = this.moveFrames[this.nextUnclaimed]

                c.chanceEarly = c.chanceLate = 0;
                if (c.firstFrame > jf.earlyFrame + this.pushCount - 1) { //at least partially in on early side
                    c.chanceFirst = (c.firstFrame < jf.earlyFrame + this.pushCount + 1) ? jf.earlyFrame + this.pushCount + 1 - c.firstFrame : 0 //need this incase we are pushing out of first frame
                    c.chancePush = this.pushFrames - this.pushCount // don't do it the first time
                    if (c.firstFrame < jf.latestFrame + this.pushCount + 2) { //had to change this from +1 to +2... need to retest all.

                        c.chanceOK = (c.chanceFirst > 0) ? (1 - this.latePush) * ((1 - c.chancePush) * c.chanceFirst + 1 - c.chanceFirst) : 1 * (1 - this.latePush)//not early or late chance. // TODO2: LATE PUSH HERE? YES, on both sides.

                        if (c.firstFrame < jf.earlyFrame + this.pushCount) {
                            c.chanceEarly = jf.earlyFrame + this.pushCount - c.firstFrame // maybe early
                            c.chanceOK = (c.chanceEarly < 1) ? (1 - c.chanceEarly) * (1 - c.chancePush) : 0 // TODO2: LATE PUSH HERE? Too tired right now.
                        }


                        if (c.firstFrame > jf.latestFrame + this.pushCount) {
                            c.chanceLate = c.firstFrame - (jf.latestFrame + this.pushCount) // maybe late
                            if (c.chanceLate < 1) {
                                let earlyFactor = (c.chanceFirst > 0) ? 1 - c.chancePush : 1  //should reduce chances if push frames blow out of early.
                                c.chanceOK = ((earlyFactor * (1 - c.chanceLate)) + (c.chanceLate * c.chancePush)) * (1 - this.latePush) // TODO2: LATE PUSH HERE: YES?
                            }
                            else if (c.chanceLate - 1 < 1) {
                                // only success if push
                                c.chanceOK = (1 - (c.chanceLate - 1)) * c.chancePush // TODO2: LatePush - I don't think here. because c.chancePush will be 0
                            }


                        }

                        if (c.firstFrame > jf.justFrame && jf.latestFrame > jf.justFrame) { //I presume push should always be zero and this is called once...but... can change later if need be.
                            this.pushFrames = c.firstFrame - jf.justFrame
                            this.pushCount = Math.floor(this.pushFrames) //only guarenteed frames.
                            if (this.pushFrames > jf.latestFrame - jf.justFrame) {
                                this.latePush = this.pushFrames - this.pushCount
                                this.pushFrames = this.pushCount
                                c.chanceOK = (1 - c.chanceLate)
                            }
                        }
                    } else {
                        c.chanceLate = c.firstFrame - (jf.latestFrame + this.pushCount)// late and clamed = 

                    }
                    c.claimedFrame = this.nextUnclaimed++; // was on time or late so claimed.

                } else {
                    c.chanceEarly = 1  //trying to fix situations where not enough presses. or not enough matches.  
                    if (redo) { // maybe I could always do this but just not increment...????
                        c.claimedFrame = this.nextUnclaimed;
                        c.chancePush = this.pushFrames - this.pushCount;
                    }
                }
            }//else we done...
        }
    }

}