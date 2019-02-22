var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (b.hasOwnProperty(p)) d[p] = b[p]; };
        return extendStatics(d, b);
    }
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
                    height: 600
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
            _this.startX = 40;
            _this.speed = 720 / 2000;
            _this.frame = 0;
            _this.stateRunning = false;
            _this.stateFinished = false;
            _this.mouseButton = [];
            return _this;
        }
        TestScene.prototype.preload = function () {
            this.load.bitmapFont('luc', ['./Fonts/lucidaconsole_0.png', './Fonts/lucidaconsole_1.png'], './Fonts/lucidaconsole.xml');
        };
        TestScene.prototype.create = function () {
            this.input.mouse.disableContextMenu();
            this.graphics = this.add.graphics({ lineStyle: { width: 1, color: 0xff0000 } });
            this.mainline = new Phaser.Geom.Line(this.startX, 300, 760, 300);
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
                if (!this.stateFinished) {
                    var x = this.frameRuler.x2 += 6; // this.speed * dt;
                    this.frameRuler.x2 = x;
                    this.frameTick.setTo(x, 320, x, 300);
                    this.graphics.strokeLineShape(this.frameRuler);
                    if (this.input.activePointer.isDown)
                        this.graphics.lineStyle(1, 0x00ff00);
                    else
                        this.graphics.lineStyle(1, 0xff0000);
                    this.graphics.strokeLineShape(this.frameTick);
                    if (this.sys.game.loop.time - this.stateStartTime > 2000)
                        this.stateFinished = true;
                }
                if (this.sys.game.loop.time - this.stateStartTime > 3000) {
                    this.stateRunning = false;
                    this.running.setAlpha(0);
                    this.frame = 0;
                }
            }
        };
        TestScene.prototype.clicked = function (pointer) {
            //stateFinished is a buffer so late clicks don't cause it to start again.
            if (this.stateRunning && !this.stateFinished) {
                var dt = pointer.time - this.stateStartTime;
                var x = 40 + this.speed * dt;
                var clickStartLine = new Phaser.Geom.Line(x, 290, x, 360);
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
                this.graphics.strokeLineShape(new Phaser.Geom.Line(43, 290, 43, 360)); //should be halfway through frame... Frame size 6?
            }
        };
        return TestScene;
    }(Phaser.Scene));
    Tappy.TestScene = TestScene;
})(Tappy || (Tappy = {}));
//# sourceMappingURL=tappycode.js.map