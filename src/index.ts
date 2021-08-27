import * as fs from 'fs';
import * as path from 'path';
import sharp from 'sharp';
import mime from 'mime-types';
import {exec} from 'child_process';
export class FileS{
	dir:string=''
	isDirectory:boolean=true
	name:string=''
	path:string=''
	static init(p:string){
		const o=new FileS();
		o.path=p;
		o.dir=dirname(p);
		o.name=basename(p);
		o.isDirectory=true;
		return o;
	}
}
export class ConfigS{
	srcArr:string[]=[]
	dist:string=''
	ffmpegPath:string=''
}
//判断为空
function ise(e:any):boolean{
	try{return !e||0===e||0===e.length||0===e.size||/^\s*$/.test(e)||(Object===e.constructor&&0===Object.keys(e).length)||'undefined'===e||'null'===e;
	}catch(e){return true;}
}
//根据文件路径获取文件目录
function dirname(e:string){
	e=pathReplaceSlash(e);
	e.substr(0,e.lastIndexOf("/"));
	return e;
}
//根据文件路径获得文件名
function basename(path:string){
	path=pathReplaceSlash(path);
	return path.split('/').reverse()[0];
}
//将字符串中的\\替换成/，用于转换windows的路径格式
function pathReplaceSlash(p:string):string{
	return p.replace(/\\/g,'/');
}
//返回文件后缀名
function fileExtension(filename:string):string{
	return filename.substring(filename.lastIndexOf('.')+1).toLowerCase();
}
//删除文件的后缀名
function fileExtentionDelete(filename:string){
	return filename.replace(/\.[^/.]+$/,'');
}
//替换文件后缀名
function fileExtentionReplace(filename:string,ext:string):string{
	return fileExtentionDelete(filename)+'.'+ext;
}
//从传入的目录字符串中获取最后一级的目录名称，无法判断传入的是目录还是文件，只能在传入之前手工处理
function lastDirOfPath(path:string):string|undefined{
	if(ise(path))return '';
	path=pathReplaceSlash(path);
	const arr:string[]=path.split('/');
	let last:string|undefined=arr.pop();
	if(ise(last))last=arr.pop();
	return last;
}
//根据mime信息，判断文件是否是图片
async function isPic(path:string){
	const mimeStr=await mime.lookup(path);
	if(!mimeStr||ise(mimeStr))return false;
	return (mimeStr as string).toLowerCase().startsWith('image');
}
//根据mime信息，判断文件是否是视频
async function isVideo(path:string){
	const mimeStr=await mime.lookup(path);
	if(!mimeStr||ise(mimeStr))return false;
	return (mimeStr as string).toLowerCase().startsWith('video');
}
//根据mime信息，判断文件是否是PDF
async function isPDF(path:string){
	const mimeStr=await mime.lookup(path);
	if(!mimeStr||ise(mimeStr))return false;
	return (mimeStr as string).toLowerCase().startsWith('application/pdf');
}
function thumbnailPath(path:string,roots:string[],thumbnail:string):string{
	if(ise(path)||ise(roots)||ise(thumbnail))return '';
	for(const r of roots) if(path.startsWith(r))return path.replace(r,thumbnail+'/'+lastDirOfPath(r))+'.webp';
	return '';
}
//递归遍历所有文件
function scan3(directoryName:string='./data',results:FileS[]=[]){
	try{
		const files=fs.readdirSync(directoryName,{withFileTypes:true});
		for(const [i,f] of files.entries()){
			const fullPath:string=pathReplaceSlash(path.join(directoryName,f.name));
			if(f.isDirectory()){
				scan3(fullPath,results);
			}else{
				const fileItem=new FileS();
				fileItem.dir=directoryName;fileItem.isDirectory=f.isDirectory();fileItem.name=f.name;fileItem.path=fullPath;
				results.push(fileItem);
			}
		}
	}catch(e){}
	return results;
}
//将毫秒ms转换成日期时间格式
function timeConversion(duration:number){
	const portions:string[]=[];
	const msInHour=1000*60*60;
	const hours=Math.trunc(duration/msInHour);
	if(hours>0){
		portions.push(hours+'h');
		duration=duration-(hours*msInHour);
	}
	const msInMinute=1000*60;
	const minutes=Math.trunc(duration/msInMinute);
	if(minutes>0){
		portions.push(minutes+'m');
		duration=duration-(minutes*msInMinute);
	}
	const seconds=Math.trunc(duration/1000);
	if(seconds>0)portions.push(seconds+'s');
	return portions.join(' ');
}
export const genThumbnail=async(config:ConfigS)=>{
	if(ise(config.dist)||ise(config.ffmpegPath)||ise(config.srcArr))throw TypeError('Config can not be empty.');
	for(const o of config.srcArr)if(ise(o))throw TypeError('srcArr can not be empty.');
	let timeStart=new Date().getTime();
	try{
		const photoArr:FileS[]=[];
		for(const o of config.srcArr)scan3(o,photoArr);
		const totalSize=photoArr.length;
		console.log('开始生成缩略图：'+photoArr.length);
		for(const [i,f] of photoArr.entries()){
			const newFilePath:string=thumbnailPath(f.path,config.srcArr,config.dist);
			const newFileDir=path.dirname(newFilePath);
			const newFilePathJpg=fileExtentionReplace(newFilePath,'jpg');
			try{if(fs.existsSync(newFilePath))continue;}catch(e){console.error(e);}
			try{if(!fs.existsSync(newFileDir))fs.mkdirSync(newFileDir,{recursive:true});}catch(e){console.error(e);}
			if(await isPic(f.path)){
				if(fileExtension(f.path)==='heic'){
					if(!fs.existsSync(newFilePathJpg)){
						try{
							const heicConvert=require('heic-convert');
							const outputBuffer=await heicConvert({
								buffer:fs.readFileSync(f.path),// the HEIC file buffer
								format:'JPEG',// output format
								quality:0.1// the jpeg compression quality, between 0 and 1
							});
							// 由于heic converter只支持换转成png或jpg格式，所以需要线转换成jpg格式，然后再用sharp转换成webp格式，最后再把jpg格式的中间文件删除。
							// 由于转换前后的文件不能是同一个，不然报错不能覆盖，所以需要一个jpg的中间文件。
							fs.writeFileSync(newFilePathJpg,outputBuffer);
							f.path=newFilePathJpg;
						}catch(e){console.error(f.path,e);}
					}
				}
				const image=sharp(f.path);
				//重新设置缩略图文件名
				image.rotate().resize(300,200).webp({quality:75}).toFile(newFilePath).then(()=>{
					if(i%10===0)console.log(`${i}/${totalSize},耗时：${timeConversion(new Date().getTime()-timeStart)}`);
					if(i===photoArr.length-1)console.log(`生成缩略图耗时：${timeConversion(new Date().getTime()-timeStart)}`);
					fs.unlink(newFilePathJpg,(e)=>{});
				}).catch(e=>{console.log(f.path);console.log(e);});
			}else if(await isVideo(f.path)){
				exec(`"${config.ffmpegPath}" -i "${f.path}" -ss 00:00:01.000 -vframes 1 -filter:v scale="300:-1" "${newFilePath}"`);
			}else if(await isPDF(f.path)){
				exec(`"${config.ffmpegPath}" -sDEVICE=jpeg -o "${newFilePath}" "${f.path}" `);
			}
		}return true;
	}catch(e){return e}
}