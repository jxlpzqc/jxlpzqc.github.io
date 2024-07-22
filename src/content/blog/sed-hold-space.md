---
title: sed 保持空间的妙用
pubDate: 2024-07-22
repost: false
tags:
  - trick 
description: 除了常规 vi 指令之外，sed 有一系列操作“保持空间”的指令，可以方便地处理文本。
---

## 问题引出

最近，在写调试脚本的时候有这样的需求：

QNX 的 gdb 可以通过 `info meminfo` 得到当前进程的内存映射信息。
下面是一个例子：

```
/proc/boot/img_codec_tga.so
        text=00003000 bytes @ 0x008d4000
                flags=00010571
                debug=00000000
                offset=0000000001104000
        data=00001000 bytes @ 0x00ad7000
                flags=00010372
                debug=00203000
                offset=0000000001107000
        dev=0x802
        ino=0xc0000078
/proc/boot/img_codec_sgi.so
        text=00002000 bytes @ 0x00ad8000
                flags=00010571
                debug=00000000
                offset=0000000001100000
        data=00001000 bytes @ 0x00cda000
                flags=00010372
                debug=00202000
                offset=0000000001102000
        dev=0x802
        ino=0xc0000077
```

而 QNX 的 gdb 不支持自动加载符号，所以我想使用脚本把这段文本输出到文件中，
然后处理成 `add-symbol-file libxxx.so 0x??????` 的形式，方便我的调试。

显然，持变量、分支、循环的 `awk` 比较适合做这件事，大致处理逻辑也很简单，读到
`/proc/boot/*` 的时候把他放在变量 `file` 里面，等到读到 `text=` 的时候，
再一并输出成 `add-symbol-file` 的形式就行，我们很容易写出一个这样的 `awk` 脚本。 

```awk
#!/usr/bin/env -S awk -f

BEGIN {
    printf "#!/usr/bin/env -S gdb -q -x\n\n"
    printf "target remote localhost:1234\n\n"

    prefix = ENVIRON["QNX_TARGET"] "/x86_64/lib/dll/"
}

/^\/proc\/boot\/img_codec_/ {
    file = $0
    file = gensub(/.*(img_codec_.+)/, prefix "\\1.sym", "g", file)
}

/^\s+text=/ {
    split($0, a, "@ ")
    text_addr = a[2]
    printf "add-symbol-file %s %s\n", file, text_addr
}
```

该脚本的输出也很漂亮

```gdb
#!/usr/bin/env -S gdb -q -x

target remote localhost:1234

add-symbol-file /home/chengzi/qnx700/target/qnx7/x86_64/lib/dll/img_codec_tga.so.sym 0x008d4000
add-symbol-file /home/chengzi/qnx700/target/qnx7/x86_64/lib/dll/img_codec_sgi.so.sym 0x00ad8000
```

但是，问题来了，我们能不能用 `sed` 去处理这件事呢。

## 保持空间

我一直认为 `sed` 的命令是 `vimscript` 的子集，毕竟常用的指令都很相似，比如 `a` `c` `s` `p` 等。

但其实，`sed` 有自己特殊的命令。下面摘自 `sed` 的 man 文档

```
h H    Copy/append pattern space to hold space.
g G    Copy/append hold space to pattern space.
x      Exchange the contents of the hold and pattern spaces.
```

其实，`sed` 为了方便文本操作，有两套空间，一套是模式空间，一套是**保持空间** (hold space)。

正常我们使用 `sed` 操作文本的时候，都是使用模式空间，`sed` 每一轮循环，
都会从输入中读入下一行到模式空间；除此以外，所有文本操作的指令，都是操作模式空间，
比如 `s` 命令，就是在模式空间进行替换，`p` 命令，就是把模式空间打印出来。

而保存空间的作用就是可以把当前模式空间的内容先保存下来，
避免 `sed` 在下一轮循环把这段文本弄丢了。

下面，举一个 Stack Overflow 上的高赞例子，看看保持空间的妙用。

```shell
echo '1
2
3' | sed -n '1!G;h;$p'
```

这里的有三条语句，其中 `G` 和 `p` 有 range 前缀，`1!G` 表明除了第一行，
其他行都执行 `G`，`$p` 表示在文件末尾行执行 `p`。

我们模拟一下过程：

| NR  | Op  | Pattern Space | Hold Space    |
| --- | --- | ------------- | ------------- |
| 1   | h   | 1             | 1             |
| 2   | G   | 2<br> 1       | 1             |
| 2   | h   | 2<br> 1       | 2<br> 1       |
| 3   | G   | 3<br> 2<br> 1 | 2<br> 1       |
| 3   | h   | 3<br> 2<br> 1 | 3<br> 2<br> 1 |
| 3   | p   | PRINT         |               |

所以，命令最后输出为
```
3
2
1
```

## 实践

其实，写 `sed` 脚本时，就可以把**保持空间**当成 `awk` 的一个变量，
所以 sed 也可以较为方便的解决上面的问题。

```shell
#!/bin/bash
PREFIX="$QNX_TARGET/x86_64/lib/dll/"

sed -n "
/^\/proc\/boot\/img_codec_/ {
    s#^/proc/boot/\(.*\)#add-symbol-file ${PREFIX}\1.sym #
    h
    n
    s/.*@ \(0x[0-9a-fA-F]*\).*/\1/
    H
    x
    s/\n/ /
    p
}
" $1
```

当然，较为复杂的文本还是用 `awk` 甚至 `python` 脚本来处理较为方便，
`sed` 还是能力有限，比如上面的环境变量获取还得依赖 shell 的能力，
它更适合一些批量的简单操作。
