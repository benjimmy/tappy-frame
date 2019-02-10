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
    var stateMachine = /** @class */ (function () {
        function stateMachine() {
        }
        return stateMachine;
    }());
    Tappy.stateMachine = stateMachine;
    var TestScene = /** @class */ (function (_super) {
        __extends(TestScene, _super);
        function TestScene() {
            var _this = _super.call(this, { key: 'TestScene' }) || this;
            _this.stateRunning = false;
            _this.speed = Tappy.InitPhaser.gameRef.config['width'] / 2 / 1000;
            _this.color = 0xffff00;
            _this.thickness = 2;
            _this.alpha = 1;
            return _this;
        }
        TestScene.prototype.preload = function () {
            //this.state.running = false;
            this.load.image("benalex", "./benalex.png");
            this.load.bitmapFont('luc', ['./Fonts/lucidaconsole_0.png', './Fonts/lucidaconsole_1.png'], './Fonts/lucidaconsole.xml');
        };
        TestScene.prototype.create = function () {
            this.graphics = this.add.graphics();
            this.input.on('pointerdown', this.clicked, this);
            this.logo = this.add.image(Tappy.InitPhaser.gameRef.config['width'] / 2, Tappy.InitPhaser.gameRef.config['height'] / 2, 'benalex');
            this.logo.setScale(.5, .5);
            /*
                        let tween = this.tweens.add({
                            targets: this.logo,
                            scaleX: { value: 1.0, duration: 2000, ease: 'Back.easeInOut' },
                            scaleY: { value: 1.0, duration: 2000, ease: 'Back.easeInOut' },
                            yoyo: false,
                            repeat: 10
                            });
              */
            this.sceneTime = this.add.bitmapText(220, 300, 'luc', '', 16);
            this.delta = this.add.bitmapText(32, 32, 'luc', '', 16);
            this.scenedt = this.add.bitmapText(220, 32, 'luc', '', 16);
            this.scenets = this.add.bitmapText(220, 50, 'luc', '', 16);
            this.running = this.add.bitmapText(220, 400, 'luc', 'RUNNING', 32);
            this.running.setAlpha(0);
        };
        TestScene.prototype.clicked = function (pointer) {
            if (this.stateRunning) {
                // nothing yet
            }
            else {
                this.stateRunning = true;
                this.stateStartTime = this.sys.game.loop.time;
                this.running.setAlpha(1);
            }
        };
        TestScene.prototype.update = function (timestep, dt) {
            //this.logo.x += this.speed * dt;
            if (this.logo.x > 600) {
                this.logo.x = 0;
            }
            this.sceneTime.setText(this.sys.game.loop.time.toString());
            this.delta.setText(this.sys.game.loop.deltaHistory);
            this.scenedt.setText(dt);
            this.scenets.setText(timestep);
            if (this.stateRunning) {
                if (this.sys.game.loop.time - this.stateStartTime > 3000) {
                    this.stateRunning = false;
                    this.running.setAlpha(0);
                }
            }
        };
        return TestScene;
    }(Phaser.Scene));
    Tappy.TestScene = TestScene;
})(Tappy || (Tappy = {}));
//# sourceMappingURL=tappycode.js.map