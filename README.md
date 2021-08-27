# ThumbnailGenerator

每个人电脑里面都存了n个G的照片，如今一张照片轻松大于10M，各看图软件打开拥有几十个文件的目录的时候，都会加载很长时间。而当缓存被清除等各种原因，下次访问的时候，又需要重新加载一次。当一个目录下有几百张大于100M的照片时，我们想在这么多照片中，找到想要的那一张……那简直是灾难。

而将这些照片生成很小的缩略图，我们找照片的时候，只在缩略图内找，找到想要的，再去源目录中查看，速度会快很多。于是有了这么一个简单的小项目。

## Useage

```javascript

npm i -S @thankin/thumbnail-generator

import{ConfigS,genThumbnail} from '@thankin/thumbnail-generator'

const config=new ConfigS();
config.srcArr.push('D:/photo');
config.srcArr.push('E:/work-photo');
config.dist='D:/thumbnail';
config.ffmpegPath='C:/Program Files/ffmpeg/ffmpeg-2021-07-27/bin/ffmpeg.exe';
config.gswinPath='C:/Program Files/gs9.54.0/bin/gswin64c.exe';
genThumbnail(config);
```

按照以上示例代码，会将D:/photo和E:/work-photo下面的所有照片、视频（包含子目录），都生成缩略图到D:/thumbnail目录下，缩略图目录为D:/thumbnail/photo & D:/thumbnail/work-photo。支持HEIC、常规图片格式，以及ffmpeg支持的各种视频格式。ffmpeg需要自行下载。

## Features

- 使用sharp生成图片缩略图
- 使用ffmpeg生成视频缩略图
- 使用ghost script生成pdf缩略图

缩略图格式为webp。我测试下来同等质量下，这是占用空间最小的文件格式。如果图片数量多，那么生成会需要很长时间，取决于电脑性能，做好等几个小时的准备。当然可以随时停止，会自动跳过已经存在缩略图的文件。

### TODO

缩略图的各种参数暂不支持自定义。部分少见的文件格式会不支持。有人帮忙最好。目前的代码我自己用是够了。如果以后能支持其他格式生成缩略图就更好了，例如word、PowerPoint等。

有问题直接提交issue。

