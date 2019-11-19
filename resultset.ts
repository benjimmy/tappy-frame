module Tappy {

    export class resultset {
        //1. capture the times that taps were made.
        //2. calc which frames they could have hit on and percentages.
        //3. compare with the just frame objects to measure % of success.
        public startTime: number;
        buttons: buttonPush[] = []
        moveFrames: jfInput[] = []
        pushCount: number = 0; //at least this much push
        pushFrames: number = 0; // chance of 1 more push - THis is not chance... It is exact in relation to the next button/
        pushMax: number = 0;
        public nextUnclaimed: number = 1;
        chanceSuccess: number = 0;
        strict: boolean


        constructor(start: number, moves: jfInput[], button: string = "1", strict: boolean = false, pushFrames: number) {
            this.pushMax = pushFrames
            this.startTime = start;
            this.buttons.push({ time: start, button: button, firstFrame: 0, claimedFrame: 0, chanceOK: 1 })
            
            this.moveFrames = moves;
            this.strict = strict
            this.buildSourceFrames()
            
            
        }

        private buildSourceFrames(){
            //for each source move frame: get the just frames, and break them out into individual frames.
            //build the main array then concat the meh frames if applicable.
            //Maybe I should do this in the maingamescene instead so I can use it for the graphics too.
      
            this.moveFrames.forEach(sf => {
                let justFrames = new Map<number,individualFrames>()

                //early meh frames
                if (sf.mehEarly != null){
                    let earlyMeh = true
                    for (let i = sf.mehEarly; i < sf.earlyFrame; i++){
                        justFrames.set(i, {earlyMeh: earlyMeh, meh: true, adjEarly: 0, adjLate: 0, push: false})// just going to assume no push on meh frames.
                        earlyMeh = false;
                    }
                }

                //just frames including pushing frames
                let firstJF = true;

                for (let i = sf.earlyFrame; i <= sf.latestFrame; i++) {
                    let push: boolean = (i > sf.justFrame)
                    justFrames.set(i,{meh: false, adjEarly: 0, adjLate: 0, push: push,firstJF:firstJF})
                    firstJF = false;
                }               
                
                //late meh frames
                if (sf.mehLate != null){
                    for (let i = sf.latestFrame+1; i <= sf.mehLate; i++){
                        //first one needs a flag for part push ***
                        let firstMeh = (i==sf.latestFrame+1 )
                        justFrames.set(i,{meh: true, partPush: firstMeh, adjEarly: 0, adjLate: 0, push: false})// just going to assume no push on meh frames.
                    }
                }

                sf.individualFrames = justFrames
            });
        }

        private pushSourceFrames(pushAmount:number, frameWithPush: number){
            this.pushFrames = pushAmount;
            this.pushCount = Math.floor(pushAmount)
            let adjAmount = pushAmount - this.pushCount
            let pushedFrames = new Map<number,individualFrames>()

            //move the numbers of each of the push sets 
            for (let i = frameWithPush+1; i <this.moveFrames.length; i++){
                let iFrames = this.moveFrames[i].individualFrames;
                let it = iFrames.entries()
                let frameNo:number
                for (let i=0;i<iFrames.size;i++){
                    let value = it.next().value
                    frameNo = value[0] + this.pushCount

                    let frameInfo:individualFrames = value[1]
                    if (frameInfo.earlyMeh || frameInfo.firstJF ) {
                        frameInfo.adjEarly = adjAmount;
                    }
                    if (frameInfo.partPush) {
                        frameInfo.adjLate = (pushAmount>this.pushMax) ? 0: adjAmount;
                        
                    }
                    pushedFrames.set(frameNo,frameInfo);
                    console.log(frameNo,frameInfo)
                }
                // generally add an extra frame with part push adjLate.
                // Not sure if this is actually needed.
                pushedFrames.set(frameNo+1,{dead:true,adjLate:adjAmount,adjEarly:0,push:false,meh:false});
                
                //return adjusted.
                this.moveFrames[i].individualFrames = pushedFrames;
            }
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
            // a new new one.  Oh well.
            // fixing JF push input... Should not be multiplying chances... Rather it should be the same chance for the same amount of the input variation within frame.
            
            let jf: Map<number,individualFrames>;
            //set up the return object with basic data
            c.firstFrame = (c.time - this.startTime) / oneFrame; // c.firstFrame  
            c.hit1Frame = Math.floor(c.firstFrame)
            c.hit2Frame = c.hit1Frame + 1

            // are there any unclaimed frames?
            if (this.nextUnclaimed < this.moveFrames.length) {
                let pushCheck:boolean = false;
                jf = this.moveFrames[this.nextUnclaimed].individualFrames // get the next JF
                
                //process first hit frame chances
                if (jf.has(c.hit1Frame)){
                    let singleJF = jf.get(c.hit1Frame)
                    if (singleJF.push) pushCheck = true
                //so what do I want here.
                //first (1 - hitstart) is the abosulte max I can have 
                //if this is a meh frame normally then it must be late or it wont have calc early

                // then situations: 
                //  1. there is an adjearly on this frame which means there's only a chance if the frame is not pushed.
                //      1a. only the first part of my hit until the push cuts into the next frame is okay.
                //  2. there is an adjlate on this frame which means there's only a change if the frame is push.
                //      2a. only the part of my hit after the push frames will count...
                    
                    let hitStart = c.firstFrame - c.hit1Frame
                    let calcLate = (singleJF.meh ) ? 0: 1 
                    
                    let calcEarly = (hitStart > singleJF.adjEarly) ? 1- hitStart: 1 - singleJF.adjEarly;
                     
                    if (singleJF.adjLate > 0) {
                        calcLate = (hitStart < singleJF.adjLate) ? singleJF.adjLate - hitStart: 0;  
                    }
                    //everything up to here is good .  Calc early * calclate looks good. not sure about DEAD
                    c.jf1Chance = (singleJF.dead) ? 0: calcEarly * calcLate;
                    console.log("hit1:" ,singleJF)
                }
                else c.jf1Chance = 0;

                //process 2nd hit frame chances.
                if (jf.has(c.hit2Frame)){

                    let singleJF = jf.get(c.hit2Frame)
                    let hitStart = c.firstFrame - c.hit1Frame
                    if (singleJF.push) pushCheck = true

                //so what do I want here.
                //first (hitstart) is the absulte max I can have  (could I make this 1-hitsart again?)
                //if this is a meh frame normally then it must be late or it wont have calc early  *** I haven't covered this.

                // then situations: 
                //  1. there is an adjearly on this frame which means there's only a chance if the frame is not pushed.
                //      1a. only the first part of my hit until the push cuts into the next frame is okay.
                //  2. there is an adjlate on this frame which means there's only a change if the frame is push.
                //      2a. only the part of my hit after the push frames will count...                    

                    //need something here - to make sure its never more than hitstart but multiply twice either... (think hit 1 is right but its hard to read.)
                    // break down the situations then make the code cleaner...
                    
                    let calc = (singleJF.meh)?0: hitStart;

                    if (singleJF.adjEarly > 0) {
                        calc = (hitStart > singleJF.adjEarly ) ? hitStart - singleJF.adjEarly:0
                    }
                    
                    if (singleJF.adjLate > 0) {
                        calc = ( hitStart > singleJF.adjLate) ? singleJF.adjLate: hitStart
                    }
                    
                    console.log("hit2:" ,singleJF)
                    c.jf2Chance = (singleJF.dead) ? 0:calc;
                }
                else c.jf2Chance = 0
                console.log(c)
                c.chanceOK = c.jf1Chance+c.jf2Chance

                // Calculate the pushframes... Happens once only I think...
                // jf.justFrame is the last Just-frame before push frames, jf.lastestframe is the last push frame
                //TODO Set a flag earlier for this if.
                if (pushCheck) {
                    this.pushSourceFrames(c.firstFrame - this.moveFrames[this.nextUnclaimed].justFrame, this.nextUnclaimed )
                }

                //failed to hit anything.  
                //    but now I'm no longer capturing late...  lets see if it matters.
                //    before early would leave it unclaimed but late wouldn't
                if (c.chanceOK == 0) {
                    c.claimedFrame = this.nextUnclaimed; //claimed next frame but can still be reclaimed
                    
                    if (this.strict) { // strict mode = all buttons must be accounted for.
                        this.nextUnclaimed++
                        c.chanceOK = 0
                    }
                }
                else {

                    c.claimedFrame = this.nextUnclaimed;
                    this.nextUnclaimed ++;
                }
            }
            else this.buttons.pop() // no unclaimed so just don't worry about storing data of buttons pushed after.

        }
 
    }

}