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
                width: 480,
                height: 320,
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
            _this.speed = Tappy.InitPhaser.gameRef.config['width'] / 2 / 1000;
            return _this;
        }
        TestScene.prototype.preload = function () {
            this.load.image("benalex", "./benalex.png");
            this.load.bitmapFont('luc', ['./Fonts/lucidaconsole_0.png', './Fonts/lucidaconsole_1.png'], './Fonts/lucidaconsole.xml');
        };
        TestScene.prototype.create = function () {
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
        };
        return TestScene;
    }(Phaser.Scene));
    Tappy.TestScene = TestScene;
})(Tappy || (Tappy = {}));
//# sourceMappingURL=tappycode.js.map