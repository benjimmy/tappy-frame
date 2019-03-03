/// <reference path='./phaser.d.ts'/>
var Tappy;
(function (Tappy) {
    class InitPhaser {
        static initGame() {
            let config = {
                type: Phaser.WEBGL,
                scale: {
                    mode: Phaser.Scale.FIT,
                    autoCenter: Phaser.Scale.CENTER_BOTH,
                    width: 1200,
                    height: 675
                },
                scene: [Tappy.TestScene],
                banner: true,
                title: 'Tappy',
                version: '1.0.0'
            };
            this.gameRef = new Phaser.Game(config);
        }
    }
    Tappy.InitPhaser = InitPhaser;
})(Tappy || (Tappy = {}));
window.onload = () => {
    Tappy.InitPhaser.initGame();
};
var Tappy;
(function (Tappy) {
    class TestScene extends Phaser.Scene {
        constructor() {
            super({ key: 'TestScene' });
            //Globals
            this.smallText = { fontFamily: 'Arial', fontSize: 12, color: '#ffffff' };
            this.mediumText = { fontFamily: 'Arial', fontSize: 18, color: '#ffffff' };
            this.largeText = { fontFamily: 'Arial', fontSize: 28, color: '#ffffff' };
            this.startX = 60;
            this.gameWidth = 1080;
            //moveDisplay
            this.justFrames = [];
            //state
            this.stateRunning = false;
            this.stateShowResults = false;
            this.frame = 0; //dont trust this for calc - only for realtime view.
            this.mouseButton = [];
        }
        preload() {
            this.load.bitmapFont('luc', ['./Fonts/lucidaconsole_0.png', './Fonts/lucidaconsole_1.png'], './Fonts/lucidaconsole.xml');
            this.load.json('moveFrames', './json/Lee/acidrain.json');
        }
        create() {
            this.input.mouse.disableContextMenu();
            this.justFrameMove = this.cache.json.get('moveFrames');
            this.lastFrame = this.justFrameMove.JustFrames[this.justFrameMove.JustFrames.length - 1].latestFrame + 5;
            this.speed = this.gameWidth / this.lastFrame / oneFrame;
            this.frameWidth = Math.round(this.gameWidth / this.lastFrame); //note-needs rounding???
            this.add.text(this.startX, 150, this.justFrameMove.MoveName, this.mediumText);
            this.add.text(this.startX, 170, this.justFrameMove.MoveNotation, this.mediumText);
            this.add.text(this.startX, 190, this.justFrameMove.Notes, this.mediumText);
            let graphicsGuide = this.add.graphics({ lineStyle: { width: 1, color: 0xff0000 }, fillStyle: { color: 0x660000, alpha: 1 } });
            for (let i = 0; i < this.lastFrame; i++) {
                this.add.text(this.startX + i * this.frameWidth + this.frameWidth / 2, 290, i.toString(), this.smallText).setOrigin(0.5);
                this.justFrames.push(new Phaser.Geom.Rectangle(this.startX + i * this.frameWidth, 250, this.frameWidth - 2, 30));
            }
            this.justFrames.forEach(frame => {
                graphicsGuide.strokeRectShape(frame);
                graphicsGuide.fillRectShape(frame);
            });
            this.justFrameMove.JustFrames.forEach(jf => {
                //early / late frame = blue - todo movestuff...
                graphicsGuide.lineStyle(1, 0x0000ff);
                graphicsGuide.fillStyle(0x000077);
                for (let i = jf.earlyFrame; i <= jf.latestFrame; i++) {
                    graphicsGuide.fillRectShape(this.justFrames[i]);
                    graphicsGuide.strokeRectShape(this.justFrames[i]);
                }
                graphicsGuide.lineStyle(1, 0x00ff00);
                graphicsGuide.fillStyle(0x007700);
                graphicsGuide.fillRectShape(this.justFrames[jf.justFrame]);
                graphicsGuide.strokeRectShape(this.justFrames[jf.justFrame]);
                this.add.text(this.startX + jf.justFrame * this.frameWidth + this.frameWidth / 2, 240, jf.move, this.smallText).setOrigin(0.5);
            });
            this.input.on('pointerdown', this.clicked, this);
            //this is for the realtime line - todo, something else - another way...
            this.graphics = this.add.graphics({ lineStyle: { width: 1, color: 0xff0000 } });
            this.frameRuler = new Phaser.Geom.Line(this.startX, 320, this.startX, 320);
            this.scenefps = this.add.bitmapText(this.gameWidth + this.startX, 32, 'luc', '', 16).setOrigin(1);
            this.running = this.add.text(600, 50, 'Tap or Click when ready', this.largeText).setOrigin();
        }
        update(timestep, dt) {
            this.scenefps.setText(Phaser.Math.FloorTo(this.sys.game.loop.actualFps, -2).toString()); //seems slow - think i should do it myself. ? How often then?
            if (this.stateRunning) {
                this.frame++;
                var runtime = this.sys.game.loop.time - this.results.startTime;
                if (!this.stateShowResults) {
                    if (runtime > this.lastFrame * oneFrame) {
                        //console.log(this.frame)
                        this.stateShowResults = true;
                    }
                    else {
                        let x = this.frameRuler.x2 += this.speed * dt;
                        this.frameRuler.x2 = x;
                        this.graphics.strokeLineShape(this.frameRuler); //I want to uses
                    }
                }
                if (runtime > (this.lastFrame + 15) * oneFrame) {
                    this.stateRunning = false;
                    this.running.setAlpha(1);
                }
            }
        }
        clicked(pointer) {
            //stateShowResults is a buffer so late clicks don't cause it to start again.
            if (this.stateRunning && !this.stateShowResults) {
                let frame = this.results.add(pointer.time);
                console.log(this.frame); // something isn't right.
                let dt = pointer.time - this.results.startTime;
                let x = this.startX + this.speed * dt;
                let clickCircle = new Phaser.Geom.Circle(x, 270, this.frameWidth / 2);
                let clickStartLine = new Phaser.Geom.Line(x, 250, x, 330);
                this.graphics.lineStyle(1, 0xffffff);
                this.graphics.fillStyle(0xffffff, 0.5);
                this.graphics.fillCircleShape(clickCircle);
                this.graphics.strokeCircleShape(clickCircle);
                this.graphics.strokeLineShape(clickStartLine);
                /*
                let x = 0;
                for (var e = -8; e < 9; e+= 8){
                    x = this.startX + this.speed * (dt + e);

                    let clickStartLine = new Phaser.Geom.Line(x, 250 + Math.abs(e*2), x, 330);
                    this.graphics.lineStyle(1, 0xffffff);
                    this.graphics.strokeLineShape(clickStartLine);
                    }
                */
                let percent = Math.floor(frame.chance * 100).toString();
                this.mouseButton.push(this.add.text(x - 2, 360, `Frame:${frame.frame.toString()}: ${percent}%`, this.smallText));
            }
            if (!this.stateRunning) {
                this.results = null;
                this.stateRunning = true;
                this.stateShowResults = false;
                this.mouseButton.forEach(element => { element.destroy(); });
                this.results = new resultset(this.sys.game.loop.time);
                this.running.setAlpha(0);
                this.frameRuler.x2 = this.startX;
                this.graphics.clear();
                this.graphics.lineStyle(1, 0xffffff);
                let firstClickX = this.startX + this.frameWidth / 2;
                this.graphics.strokeLineShape(new Phaser.Geom.Line(firstClickX, 250, firstClickX, 330)); //should be halfway through frame... Frame size 6?
                this.frame = 0;
            }
        }
    }
    Tappy.TestScene = TestScene;
    const oneFrame = 16.666666666666667;
    class resultset {
        constructor(start, button = "1") {
            this.buttons = [];
            this.startTime = start;
            this.buttons.push({ time: start, button: button });
        }
        add(time, button = "1") {
            let index = this.buttons.push({ time: time, button: button });
            this.calcFrames(this.buttons[index - 1]);
            return this.getClosestFrame(this.buttons[index - 1]);
        }
        calcFrames(currentButton) {
            //not using yet..
            let timediff = currentButton.time - this.startTime; //eg 19.17
            let timeFrame = timediff / oneFrame; // part through 1st frame. =  1.15
            let timeMod = timediff % oneFrame; // how far through the 1st frame = 2.5
            let timePerc = Phaser.Math.Percent(timeMod, 0, oneFrame); //chance is backwards. later the worse.
            //dsomething is still wrong here>.....
            //This will need track and add push frames.
            currentButton.earlyFrame = { frame: Math.floor(timediff / oneFrame), chance: 1 - timePerc };
            currentButton.lateFrame = { frame: Math.floor((timediff + oneFrame) / oneFrame), chance: timePerc }; //might need to shift these a bit
        }
        getClosestFrame(b) {
            if (b.earlyFrame.chance > .5) {
                return b.earlyFrame;
            }
            else
                return b.lateFrame;
        }
    }
})(Tappy || (Tappy = {}));
//# sourceMappingURL=tappycode.js.map