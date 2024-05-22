---
title: printf 怎么打印 size_t
pubDate: 2024-05-22
tags:
- C++
repost: false
---

## 引子

这是一个很有意思的点，我们知道，很多时候为了各个平台的兼容性，我们不应该用 `int` 或者 `unsinged int` ，而应该采用 `size_t` 和 `ptrdiff_t` 等类型。

比如我们应该避免以下写法：

```cpp
// sample 1: use ssize_t (defined in UNIX systems).
int writed = write(fd, buf, count);

// sample 2: use size_t or vector<int>::size_type
//           or just use auto
for (int a = 0; a < vec.size(); ++a);

// sample 3: use ptrdiff_t
char *result = strstr(str, patten);
int distance = result - str;
```

## printf 格式化字符串长度修饰符

但是，在 `printf` 当中，我们应该怎么去输出一个 `size_t` 和 `ptrdiff_t` 呢？使用 `%d` `%ld` `%lld` 似乎都不太合理 ？

其实，printf 的格式化字符串中长度修饰符（Length Modifier）就给了解决办法[^1]，应该采用 `z` 来表示 `size_t` 类型，采用 `t` 来表示 `ptrdiff_t` 类型。

所以可以采用这种方式打印最为合理：这种方式在 C++ 11 和 C99 中都是标准化的。

```cpp
size_t size = sizeof(arr);
printf("Array size is %zu", size);
```



另外提一嘴，`size_t` 和 `ptrdiff_t` 一个无符号，一个有符号，但是他们在大小上是一样的吗，另外他们和 `uintptr_t` 大小有什么区别？[^2]

在主流平台上，这些类型的大小确实一样，和机器的字长相等。但是根据标准定义，他们确实可以不一样。

因为标准定义，`size_t` 必须可以容纳数组，`ptrdiff_t` 必须可以容纳指针的差。`uintptr_t` 足以保有指针的无符号整数类型。

但是可能存在一个这样的机器，寻址空间是 0xf000-0xffff，`uintptr_t` 可以设定为16位，`ptrdiff_t` 可以设定为13位。比如数组可以限定在16位大小以内，而机器字长是32位等待这些情况。所以为了程序良好的鲁棒性，最好区分这几种类型。



## inttypes.h 头文件

另外提一下这个头文件，`inttypes.h` 或者 `cinttypes` 提供了一些用于打印的宏，但是他不支持 size_t 和 ptrdiff_t 的打印，但是可以用来打印 `uintptr_t` 和 `intmax_t`。

比如常用的有 `PRIdMAX` 和 `PRIdPTR`。

```cpp
intptr_t a = 1;
printf("a = " PRIdPtr, a);
```





[^1]: [printf - cppreference.com](https://en.cppreference.com/w/cpp/io/c/fprintf)

[^2]: [size_t vs. uintptr_t - Stack Overflow](https://stackoverflow.com/questions/1464174/size-t-vs-uintptr-t)
