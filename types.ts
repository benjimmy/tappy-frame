module Tappy {
    export class tappyTools {
        static centerButtonText (gameText, gameButton) {
            Phaser.Display.Align.In.Center(
              gameText,
              gameButton
            )};
    }
    //buttons captured in resultset
    export interface buttonPush {
        button?: string
        time: number
        firstFrame?: number

        claimedFrame?: number  
        chanceOK?: number

        hit1Frame?: number
        hit2Frame?: number
        //hit1Chance?: number
        //hit2Chance?: number
        jf1Chance?: number
        jf2Chance?: number
    }

    //define Just Frame objects loaded from JSON.
    export interface justFrames {
        MoveName: string;
        MoveNotation: string;
        Notes: string;
        DefaultStrict: boolean;
        DirectionsOK: boolean;
        JustFrames?: (jfInput)[] | null;
    }
    export interface jfInput {
        id: number;
        move: number;
        mehEarly: number;    
        earlyFrame: number;
        justFrame: number;
        latestFrame: number;
        mehLate: number;
        optional: boolean;
        individualFrames?: Map<number,individualFrames>;
    }

    export interface individualFrames  {
        earlyMeh?: boolean;
        dead?: boolean;
        meh: boolean;
        push: boolean;
        adjEarly: number;
        adjLate: number;
        firstJF?:boolean;
        partPush?:boolean;
    }

    
}