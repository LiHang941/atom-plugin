[travis-image]: https://api.travis-ci.org/nestjs/nest.svg?branch=master
[travis-url]: https://travis-ci.org/nestjs/nest
[linux-image]: https://img.shields.io/travis/nestjs/nest/master.svg?label=linux
[linux-url]: https://travis-ci.org/nestjs/nest

## Installation

```bash
$ npm install
```

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## 创建地址
```
curl -X POST \
  http://127.0.0.1:3000/atom/createAddress \ 
  -d seed=<你的随机数 一般用uuid>
```

## 签名
```
curl -X POST \
 http://127.0.0.1:3000/atom/atom/sign \
  -d 'fromAddress=<发起者地址>&toAddress=<收款地址>&amount=<金额>&memo=<备注>&privateKey=<私钥>&publicKey=<公钥>&accountNumber=<账户number>&sequence=<账户seq>'
```

## 说明
只针对主网简单转账签名   
有需求看源码更改
