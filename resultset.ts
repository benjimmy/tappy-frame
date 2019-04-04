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
    }

    export class  resultset {
        //1. capture the times that taps were made.
        //2. calc which frames they could have hit on and percentages.
        //3. compare with the just frame objects to measure % of success.
        public startTime: number;
        buttons:buttonPush[] = []
        moveFrames:jfInput[] = []
        pushCount: number = 0;
        pushFrames: number = 0;
        public nextUnclaimed: number = 1;
        chanceSuccess: number = 0;

        constructor(start:number, moves:jfInput[], button:string = "1") {

            this.startTime = start;
            this.buttons.push({time: start, button: button,firstFrame:0,claimedFrame:0,chanceEarly:0,chanceFirst:0,chanceLate:0,chancePush:0,chanceOK:1})

            this.moveFrames = moves;
        }

        public add(time:number, button:string = "1") {  

            let index = this.buttons.push({time: time,button: button})
            this.calcFrames(this.buttons[index-1])
        }
        
        public getResult():number {
            let chances: number[] = new Array(this.moveFrames.length)
            for (let i = 0; i < chances.length; i++) {
                chances[i] = 0
            }
            this.buttons.forEach(b => {
                if (b.claimedFrame !== null) chances[b.claimedFrame] = b.chanceOK
            });


            return Phaser.Math.FloorTo(chances.reduce(function(product,value){return product*value}) *100,-2)

        }
        public recalcLast() {
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
     
            let jf:jfInput;
            
            c.firstFrame = timeFrame
            if( this.nextUnclaimed < this.moveFrames.length) {
                jf = this.moveFrames[this.nextUnclaimed]
            
                c.chanceEarly = c.chanceLate = 0;
                if(c.firstFrame > jf.earlyFrame + this.pushCount -1  ){ //at least partially in on early side
                    c.chanceFirst = (c.firstFrame < jf.earlyFrame + this.pushCount + 1)? jf.earlyFrame+this.pushCount+1-c.firstFrame:0 //need this incase we are pushing out of first frame
                    c.chancePush = this.pushFrames - this.pushCount // don't do it the first time
                    if (c.firstFrame < jf.latestFrame + this.pushCount + 1 ) { //at least partially in on late side
                        
                        if (c.firstFrame < jf.earlyFrame + this.pushCount) c.chanceEarly = jf.earlyFrame + this.pushCount - c.firstFrame // maybe early
                            // keeping percent justFrame seperate calculate it in the results. (earlyc*(1-pushc)+pushc) = true early chance ***WRONG!

                        if (c.firstFrame > jf.latestFrame + this.pushCount) c.chanceLate = c.firstFrame - (jf.latestFrame + this.pushCount) // mayber late
                            // (2 *earlyC * pushc) - earlyc -pushc -1 = true late chance
                                        
                        if (c.firstFrame > jf.justFrame && jf.latestFrame > jf.justFrame) { //I presume push should always be zero and this is called once...but... can change later if need be.
                            this.pushFrames = c.firstFrame - jf.justFrame
                            this.pushCount = Math.floor(this.pushFrames) //only guarenteed frames.
                            if (this.pushFrames > jf.latestFrame - jf.justFrame) this.pushFrames = this.pushCount // probably dont need this if I read late first but...?
                        }
                    }else c.chanceLate = c.firstFrame - (jf.latestFrame + this.pushCount)// late and clamed = 
                    c.claimedFrame = this.nextUnclaimed++; // was on time or late so claimed.
                    
                }else {
                    c.chanceEarly=1  //trying to fix situations where not enough presses. or not enough matches.  
                    if (redo) { // maybe I could always do this but just not increment...????
                        c.claimedFrame = this.nextUnclaimed;
                        c.chancePush = this.pushFrames - this.pushCount;
                    }
                }
            }//else we done...
            
            //moving out from draw function... TODO - move it into the frame calcs maybe?
            let pushEarly = 0
            let pushLate = 0

            if (c.claimedFrame) {
                //Calculate success.  Should move this into the Results object

                if (c.chanceEarly > 0 ) { 
                    pushEarly = (c.chanceEarly < 1) ? (1-c.chanceEarly)*(1-c.chancePush): 0 
                                // early = fail push = fail, only success i not (early * not push)
                                // I don't need to check chanceEarly < 1 as it will not be claimed... leaving it in case I change the claim system.     
                    c.chanceOK = pushEarly
                }
                else if (c.chanceLate > 0) {
                    // todo, can probably simply this into 1 assignment.
                    if (c.chanceLate < 1) {
                        let earlyFactor = (c.chanceFirst > 0) ? 1-c.chancePush: 1  //should reduce chances if push frames blow out of early.
                        pushLate = (earlyFactor*(1-c.chanceLate))+(c.chanceLate*c.chancePush)
                                // not late = okay. late only okay if push
                                // 1-late*1(push chance deosn't matter *) + (late*push)
                                // *unless it is a true just frame which I havent dealt with.
                    }
                    else if (c.chanceLate - 1 < 1) {
                                // only success if push
                                pushLate = (1-( c.chanceLate -1))*c.chancePush
                                // range 0 to .9999
                                // if it is exactly 0 - then chance is = push chance 
                                
                    }

                    c.chanceOK = pushLate 
                }
                else c.chanceOK = (c.chanceFirst > 0) ? (1-c.chancePush)*c.chanceFirst + 1-c.chanceFirst: 1
                //chance no push * chance first + chance 2nd * 1 as success if push or not.                                                                    
            }

        }
    }
    
    //define Just Frame objects loaded from JSON.
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
}