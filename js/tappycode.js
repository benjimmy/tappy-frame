var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
/// <reference path='./phaser.d.ts'/>
var Tappy;
(function (Tappy) {
    var InitPhaser = /** @class */ (function () {
        function InitPhaser() {
        }
        InitPhaser.initGame = function () {
            var config = {
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
        };
        return InitPhaser;
    }());
    Tappy.InitPhaser = InitPhaser;
})(Tappy || (Tappy = {}));
window.onload = function () {
    Tappy.InitPhaser.initGame();
};
var Tappy;
(function (Tappy) {
    var TestScene = /** @class */ (function (_super) {
        __extends(TestScene, _super);
        function TestScene() {
            var _this = _super.call(this, { key: 'TestScene' }) || this;
            //Globals
            _this.smallText = { fontFamily: 'Arial', fontSize: 12, color: '#ffffff' };
            _this.mediumText = { fontFamily: 'Arial', fontSize: 18, color: '#ffffff' };
            _this.largeText = { fontFamily: 'Arial', fontSize: 28, color: '#ffffff' };
            _this.startX = 60;
            _this.gameWidth = 1080;
            //moveDisplay
            _this.justFrames = [];
            //state
            _this.stateRunning = false;
            _this.stateShowResults = false;
            _this.frame = 0; //dont trust this for calc - only for realtime view.
            _this.mouseButton = [];
            return _this;
        }
        TestScene.prototype.preload = function () {
            this.load.bitmapFont('luc', ['./Fonts/lucidaconsole_0.png', './Fonts/lucidaconsole_1.png'], './Fonts/lucidaconsole.xml');
            this.load.json('moveFrames', './json/Lee/acidrain.json');
        };
        TestScene.prototype.create = function () {
            var _this = this;
            this.input.mouse.disableContextMenu();
            this.justFrameMove = this.cache.json.get('moveFrames');
            this.lastFrame = this.justFrameMove.JustFrames[this.justFrameMove.JustFrames.length - 1].latestFrame + 5;
            this.speed = this.gameWidth / this.lastFrame / oneFrame;
            this.frameWidth = Math.round(this.gameWidth / this.lastFrame); //note-needs rounding???
            this.add.text(this.startX, 150, this.justFrameMove.MoveName, this.mediumText);
            this.add.text(this.startX, 170, this.justFrameMove.MoveNotation, this.mediumText);
            this.add.text(this.startX, 190, this.justFrameMove.Notes, this.mediumText);
            var graphicsGuide = this.add.graphics({ lineStyle: { width: 1, color: 0xff0000 }, fillStyle: { color: 0x660000, alpha: 1 } });
            for (var i = 0; i < this.lastFrame; i++) {
                this.add.text(this.startX + i * this.frameWidth + this.frameWidth / 2, 290, i.toString(), this.smallText).setOrigin(0.5);
                this.justFrames.push(new Phaser.Geom.Rectangle(this.startX + i * this.frameWidth, 250, this.frameWidth - 2, 30));
            }
            this.justFrames.forEach(function (frame) {
                graphicsGuide.strokeRectShape(frame);
                graphicsGuide.fillRectShape(frame);
            });
            this.justFrameMove.JustFrames.forEach(function (jf) {
                //early / late frame = blue - todo movestuff...
                graphicsGuide.lineStyle(1, 0x0000ff);
                graphicsGuide.fillStyle(0x000077);
                for (var i = jf.earlyFrame; i <= jf.latestFrame; i++) {
                    graphicsGuide.fillRectShape(_this.justFrames[i]);
                    graphicsGuide.strokeRectShape(_this.justFrames[i]);
                }
                graphicsGuide.lineStyle(1, 0x00ff00);
                graphicsGuide.fillStyle(0x007700);
                graphicsGuide.fillRectShape(_this.justFrames[jf.justFrame]);
                graphicsGuide.strokeRectShape(_this.justFrames[jf.justFrame]);
                _this.add.text(_this.startX + jf.justFrame * _this.frameWidth + _this.frameWidth / 2, 240, jf.move, _this.smallText).setOrigin(0.5);
            });
            this.input.on('pointerdown', this.clicked, this);
            //this is for the realtime line - todo, something else - another way...
            this.graphics = this.add.graphics({ lineStyle: { width: 1, color: 0xff0000 } });
            this.frameRuler = new Phaser.Geom.Line(this.startX, 320, this.startX, 320);
            this.scenefps = this.add.bitmapText(this.gameWidth + this.startX, 32, 'luc', '', 16).setOrigin(1);
            this.running = this.add.text(600, 50, 'Tap or Click when ready', this.largeText).setOrigin();
        };
        TestScene.prototype.update = function (timestep, dt) {
            this.scenefps.setText(Phaser.Math.FloorTo(this.sys.game.loop.actualFps, -2).toString()); //seems slow - think i should do it myself. ? How often then?
            if (this.stateRunning) {
                this.frame++; // dont use frames for state
                var runtime = this.sys.game.loop.time - this.results.startTime
                
                if (!this.stateShowResults) {
                    var x = this.frameRuler.x2 += this.speed * dt; //this.frameWidth // 
                    this.frameRuler.x2 = x;
                    this.graphics.strokeLineShape(this.frameRuler);
                    if (runtime > this.lastFrame * oneFrame )
                        this.stateShowResults = true;
                }
                

                if (runtime > (this.lastFrame + 30) * oneFrame ){
                    this.stateRunning = false;
                    this.running.setAlpha(1);
                }
            }
        };
        TestScene.prototype.clicked = function (pointer) {
            //stateShowResults is a buffer so late clicks don't cause it to start again.
            if (this.stateRunning && !this.stateShowResults) {
                this.results.add(pointer.time);
                var dt = pointer.time - this.results.startTime;
                
                for (var e = -8; e < 9; e+= 8){
                var x = this.startX + this.speed * (dt + e);
                
                var clickStartLine = new Phaser.Geom.Line(x, 250 + Math.abs(e), x, 330);
                this.graphics.lineStyle(1, 0xffffff);
                this.graphics.strokeLineShape(clickStartLine);
                }
                this.mouseButton.push(this.add.text(x - 2, 360, pointer.buttons.toString(), this.smallText));
            }
            if (!this.stateRunning) {
                this.results = null;
                this.stateRunning = true;
                this.stateShowResults = false;
                this.mouseButton.forEach(function (element) { element.destroy(); });
                this.results = new resultset(this.sys.game.loop.time);
                this.running.setAlpha(0);
                this.frameRuler.x2 = this.startX;
                this.graphics.clear();
                this.graphics.lineStyle(1, 0xffffff);
                var firstClickX = this.startX + this.frameWidth / 2;
                this.graphics.strokeLineShape(new Phaser.Geom.Line(firstClickX, 250, firstClickX, 330)); //should be halfway through frame... Frame size 6?
                this.frame = 0;
            }
        };
        return TestScene;
    }(Phaser.Scene));
    Tappy.TestScene = TestScene;
    var oneFrame = 16.666666666666667;
    var resultset = /** @class */ (function () {
        function resultset(start, button) {
            if (button === void 0) { button = "1"; }
            this.startTime = start;
            this.currentButton = { button: button, time: start };
            this.calcFrames(start);
        }
        resultset.prototype.add = function (time, button) {
            if (button === void 0) { button = "1"; }
            return "100%";
        };
        resultset.prototype.calcFrames = function (newTime) {
            //not using yet..
            var timediff = newTime - this.startTime;
            var timeMod = timediff % oneFrame;
            var timePerc = Phaser.Math.Percent(timeMod, 0, oneFrame);
            var timeFrame = timediff / oneFrame;
            this.currentButton.time = newTime;
            this.currentButton.centreFrame = { frame: Math.floor(timediff / oneFrame) };
            //this.currentButton.earlyFrame.frame = 
        };
        return resultset;
    }());
})(Tappy || (Tappy = {}));
//# sourceMappingURL=tappycode.js.map
