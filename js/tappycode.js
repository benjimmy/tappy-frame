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
                    width: 800,
                    height: 450
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
            _this.smallText = { fontFamily: 'Arial', fontSize: 8, color: '#ffffff' };
            _this.mediumText = { fontFamily: 'Arial', fontSize: 14, color: '#ffffff' };
            _this.startX = 40;
            //moveDisplay
            _this.redFrame = [];
            //state
            _this.stateRunning = false;
            _this.stateFinished = false;
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
            this.lastFrame = this.justFrameMove.JustFrames[this.justFrameMove.JustFrames.length - 1].latestFrame + 15;
            this.speed = 720 / this.lastFrame / 16.666666666666667;
            this.frameWidth = Math.round(720 / this.lastFrame); //note-needs rounding???
            this.add.text(this.startX, 150, this.justFrameMove.MoveName, this.mediumText);
            this.add.text(this.startX, 170, this.justFrameMove.MoveNotation, this.mediumText);
            this.add.text(this.startX, 190, this.justFrameMove.Notes, this.mediumText);
            var graphicsGuide = this.add.graphics({ lineStyle: { width: 1, color: 0xff0000 }, fillStyle: { color: 0x660000, alpha: 1 } });
            for (var i = 0; i < this.lastFrame; i++) {
                this.add.text(this.startX + i * this.frameWidth + this.frameWidth / 2, 290, i.toString(), this.smallText).setOrigin(0.5);
                this.redFrame.push(new Phaser.Geom.Rectangle(this.startX + i * this.frameWidth, 250, this.frameWidth - 2, 30));
            }
            this.redFrame.forEach(function (frame) {
                graphicsGuide.strokeRectShape(frame);
                graphicsGuide.fillRectShape(frame);
            });
            this.justFrameMove.JustFrames.forEach(function (jf) {
                //early / late frame = blue - todo movestuff...
                graphicsGuide.lineStyle(1, 0x0000ff);
                graphicsGuide.fillStyle(0x000077);
                for (var i = jf.earlyFrame; i < jf.latestFrame; i++) {
                    graphicsGuide.fillRectShape(_this.redFrame[i]);
                    graphicsGuide.strokeRectShape(_this.redFrame[i]);
                }
                graphicsGuide.lineStyle(1, 0x00ff00);
                graphicsGuide.fillStyle(0x007700);
                graphicsGuide.fillRectShape(_this.redFrame[jf.justFrame]);
                graphicsGuide.strokeRectShape(_this.redFrame[jf.justFrame]);
                _this.add.text(_this.startX + jf.justFrame * _this.frameWidth + _this.frameWidth / 2, 240, jf.move, { fontFamily: 'Arial', fontSize: 8, color: '#ffffff' }).setOrigin(0.5);
            });
            //this is for the realtime line - though the top is drawn upfront.
            this.graphics = this.add.graphics({ lineStyle: { width: 1, color: 0xff0000 } });
            this.mainline = new Phaser.Geom.Line(this.startX, 300, this.startX + this.frameWidth * this.lastFrame, 300);
            this.graphics.strokeLineShape(this.mainline);
            this.frameTick = new Phaser.Geom.Line(0, 0, 0, 0);
            this.frameRuler = new Phaser.Geom.Line(this.startX, 320, this.startX, 320);
            this.input.on('pointerdown', this.clicked, this);
            this.sceneTime = this.add.bitmapText(220, 300, 'luc', '', 16);
            this.scenedt = this.add.bitmapText(220, 32, 'luc', '', 16);
            this.scenets = this.add.bitmapText(220, 50, 'luc', '', 16);
            this.running = this.add.bitmapText(220, 400, 'luc', 'RUNNING', 32);
            this.running.setAlpha(0);
        };
        TestScene.prototype.update = function (timestep, dt) {
            this.scenedt.setText(dt);
            this.scenets.setText(timestep);
            if (this.stateRunning) {
                this.frame++;
                if (!this.stateFinished) {
                    var x = this.frameRuler.x2 += this.speed * dt; // or += this.frameWidth;
                    this.frameRuler.x2 = x;
                    this.frameTick.setTo(x, 320, x, 300);
                    this.graphics.strokeLineShape(this.frameRuler);
                    if (this.input.activePointer.isDown)
                        this.graphics.lineStyle(1, 0x00ff00);
                    else
                        this.graphics.lineStyle(1, 0xff0000);
                    this.graphics.strokeLineShape(this.frameTick);
                    if (this.frame >= this.lastFrame)
                        this.stateFinished = true;
                }
                if (this.frame >= this.lastFrame + 30) {
                    this.stateRunning = false;
                    this.running.setAlpha(0);
                }
            }
        };
        TestScene.prototype.clicked = function (pointer) {
            //stateFinished is a buffer so late clicks don't cause it to start again.
            if (this.stateRunning && !this.stateFinished) {
                var dt = pointer.time - this.stateStartTime;
                var x = 40 + this.speed * dt;
                var clickStartLine = new Phaser.Geom.Line(x, 300, x, 360);
                this.graphics.lineStyle(1, 0xffffff);
                this.graphics.strokeLineShape(clickStartLine);
                this.mouseButton.push(this.add.text(x - 2, 360, pointer.buttons.toString(), { fontFamily: 'Arial', fontSize: 8, color: '#ffffff' }));
            }
            if (!this.stateRunning) {
                this.stateRunning = true;
                this.stateFinished = false;
                this.mouseButton.forEach(function (element) { element.destroy(); });
                this.stateStartTime = this.sys.game.loop.time;
                this.running.setAlpha(1);
                this.frameRuler.x2 = 40;
                this.graphics.clear();
                this.graphics.strokeLineShape(this.mainline);
                this.graphics.lineStyle(1, 0xffffff);
                var firstClickX = 40 + this.frameWidth / 2;
                this.graphics.strokeLineShape(new Phaser.Geom.Line(firstClickX, 290, firstClickX, 360)); //should be halfway through frame... Frame size 6?
                this.frame = 0;
            }
        };
        return TestScene;
    }(Phaser.Scene));
    Tappy.TestScene = TestScene;
})(Tappy || (Tappy = {}));
//# sourceMappingURL=tappycode.js.map
