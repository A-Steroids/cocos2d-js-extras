cocos2d-js extras
=========

[cocos2d-x][1] is a multi-platform framework for building 2d games, interactive books, demos and other graphical applications.
It is based on [cocos2d-iphone][2], but instead of using Objective-C, it uses C++.
It works on iOS, Android, Tizen, Windows Phone and Store Apps, OS X, Windows, Linux and Web platforms.

This repository contains various patches and extensions for original cocos2d-js framework, used internally for our projects (games!) at A-Steroids 

How to use
-----------------------

Right now it contains only updated/patched version of Spine runtime (weighted mesh support) for WebGL, so you just need:
* navigate to your project's source
* overwrite folder frameworks/cocos2d-html5/extensions/spine with our version
* enjoy!

Contact us
----------

   * E-mail: [mailto:anton@a-steroids.com][3]

[1]: http://www.cocos2d-x.org "cocos2d-x"
[2]: http://www.cocos2d-iphone.org "cocos2d for iPhone"
[3]: mailto:anton@a-steroids.com
