---
title: C/C++ 宏的图灵完备性
pubDate: 2024-07-26
repost: false
tags:
  - C++
---

## 引子

我们知道，C++ 的模板是一种类型安全的、更高级的“宏”。
而用仅仅采用 C++ 98 的模板，就可以实现图灵完备性，用于编译期计算。

那么，C/C++ 的宏呢？它们能实现图灵完备性吗？

## 开始之前

在开始之前，首先安利一个 C/C++ 宏展开过程的调试工具：[ppstep](https://github.com/notfoundry/ppstep/blob/master/src/ppstep.cpp) [^1] 。
其包装了 Boost wave，可以方便的打印宏展开的过程，方便我们查看宏编写的问题。

除此以外，Visual Studio 也提供展示宏展开过程的能力，把鼠标放在宏调用上，可以点击悬浮菜单上的“宏展开过程”。

## 宏的图灵完备性

通常来说，有能力模拟改变状态、条件、循环、递归的语言，就可以实现图灵完备性。

那么，C/C++ 的宏呢？

### 改变状态

首先我们思考一下宏替换是干什么，无非就是把字符串A替换成字符串B，这个替换过程不就是一个状态机嘛，那怎么实现呢？

假设图灵机内部的状态是一个 0-9 的数字，下面举几个例子，展示如何用 C/C++ 的宏来改变状态：

1. 实现一个“求后继数”的功能：

```cpp
#define INC(x) INC_##x

#define INC_0 1
#define INC_1 2
#define INC_2 3
```

2. 实现一个“取反”的功能：

```cpp
#define NOT(x) NOT_##x

#define NOT_0 1
#define NOT_1 0
```

好的，我们测试一下，编写一个下面的文件：
```cpp
NOT(1)
INC_5()
```


使用 GNU 编译器，可以使用 `gcc -E` 命令或者 `cpp` 命令，查看宏替换结果。
下面是上面文件的运行结果：

```
$ gcc -E ./learn.cpp
# 0 "./learn.cpp"
# 0 "<built-in>"
# 0 "<command-line>"
# 1 "/usr/include/stdc-predef.h" 1 3 4
# 0 "<command-line>" 2
# 1 "./learn.cpp"
# 44 "./learn.cpp"
0
6
```

这就简单测试了我们的 DEC 宏 以及 NOT 宏。

### 条件

其实条件判断和改变状态是类似的，下面是一种示例：

```cpp
#define IF(cond, if_true, if_false) IF_##cond(if_true, if_false)

#define IF_0(x, y) y
#define IF_1(x, y) x
```

好的，我们用下面的程序测试一下：
```cpp
#define IS_WINDOWS 1

IF(1, int x = 1;, int x = 2;)
IF(IS_WINDOWS, WSASocket, socket)()
```

替换结果：
```cpp
int x = 1;

IF_IS_WINDOWS (WSASocket, socket)()
```

发现存在问题，第二个宏被替换成了 IF_IS_WINDOWS，这是因为宏替换的规则决定的，下面规则摘自 [^2]：

> **扫描与替换：**
> - 扫描中跟踪所替换的宏。如果扫描找到了与这种宏相匹配的文本，那么就会将它标记为“将被忽略”（所有扫描都将忽略它）。这就避免了发生递归。
> - 如果扫描遭到了函数式宏，那么它的实参在放入替换列表 之前会先被扫描。**但 # 和 ## 运算符接受不经扫描的实参。**
> - 宏替换之后，扫描所产生的文本。

加粗部分的意思就是，实参之前遇到#或之后遇到##，不管实参是不是宏，实参都将不再展开。

所以我们添加一个CAT宏，先让IF宏把实参展开了，然后调用这个CAT宏进行连接，
所以我们可以把上面的 `IF##cond(if_true, if_false)`，改成下面这种形式：

```cpp
#define CAT(a, ...) a ## __VA_ARGS__
#define IF(cond, if_true, if_false) CAT(IF_, cond) (if_true, if_false)
```

然后再测试上面的代码，就正常了。


上面的IF例子是双值判断（0，1），下面再举一个判断一个数是否为 0 （0, any）的例子，
通过改变参数的偏移来完成这个判断（其实这种技巧还可以实现c语言的“函数按个数重载”特性，感兴趣的可以参考 [StackOverflow](https://stackoverflow.com/questions/11761703/overloading-macro-on-number-of-arguments) [^3] 上的这个帖子）

```cpp
#define CHECK_N(x, n, ...) n
#define CHECK(...) CHECK_N(__VA_ARGS__, 0,)
#define IS_ZERO(x) CHECK(CAT(IS_ZERO_, x)) //  ~, 1, 1   IS_ZERO_5, 0

#define IS_ZERO_0 ~, 1
```

但是很可惜，经过测试，MSVC 在进行宏替换的时候，会把 ~, 1 当成一个参数，所以上面的宏在 MSVC 下是没法用的。

### 循环

C++ 模板一般通过偏特化实现元编程，核心是把循环转换成递归。
和 C++ 的模板一样，C/C++ 的宏也是通过递归来实现循环。模仿这种思路，
我们写了一个这样的宏。

```cpp
#define ADD(x, y) IF(IS_ZERO(x), y, ADD(INC(x), DEC(y)))
```

但是很可惜的是，C/C++ 的宏的替换规则就是为了防止递归设计的，但是，
还是可以通过一些骚操作让宏支持“递归”的。[^4]

核心的思想是防止上面所列的规则的第二条，即宏被标记为“将被忽略”。
具体的骚操作实施起来有三点：

1. 创建宏的副本

因为宏替换到自己后就会生成锁定部分，所以最朴素想法是创建一个新宏，实现交替替换。

```cpp
#define FUN_A(x) x FUN_B(x)
#define FUN_B(x) x FUN_A(x)
```

2. 使用空替换宏

可是在上面的例子中，如果我们调用 FUN_A(a)，整个过程怎么被替换的？

```cpp
FUN_A(a) // how it expand ?
```

下面文本指示了替换过程，第三次替换到 FUN_A 之后，FUN_A(a) 就会被标记为“将被忽略”，即该部分永远不会触发替换了。（替换过程可以编译上面提到的 ppstep 工具查看）

```
FUN_A(a) 
a FUN_B(a)
a a FUN_A(a)
    ~~~~~~~~ // will be ignored forever
```

我们在调用中间调用一个 EMPTY()，宏处理器在一次扫描的过程中，并不会把 FUN_B 当成宏来替换（宏处理器只会替换 `FUN_B()`，不会替换 `FUN_B`），所以就产生了下面的结果，也不会有任何 token 被标记为“将被忽略”。

```cpp
#define EMPTY()

#define FUN_A(x) x FUN_B EMPTY() (x)
#define FUN_B(x) x FUN_A EMPTY() (x)

FUN_A(a) // how it expand ?
```

```
FUN_A(a)
a FUN_B EMPTY() (a)
a FUN_B (a)
```

3. 增加扫描


上面的例子中 `FUN_A(a)` 被替换成了 `a FUN_B (a)`，如果能让宏处理器再扫描一次，
就会生成`a a FUN_A (a)`，而且不会产生“将被忽略”的 token。

可是如何增加扫描呢，做法非常的简单，直接定义一个宏，对宏进行展开的时候，就会开启重新扫描。（对应宏替换规则的第三点），整个替换过程增加了一轮。

```
#define SCAN(x) x

SCAN(FUN_A(a)) // a a FUN_A ( a )
```


那么，我们可以创造一个较为通用的宏，实现递归：
```cpp
#define EMPTY0()
#define EMPTY1() EMPTY0 EMPTY0() ()
#define EMPTY() EMPTY1 EMPTY1() ()

/// *******
/// DEFER 封装了上面所说的第二点
/// *******
#define DEFER(id) id EMPTY()

#define EVAL0(...) __VA_ARGS__
#define EVAL1(...) EVAL0 (EVAL0 (EVAL0 (__VA_ARGS__)))
#define EVAL2(...) EVAL1 (EVAL1 (EVAL1 (__VA_ARGS__)))
#define EVAL3(...) EVAL2 (EVAL2 (EVAL2 (__VA_ARGS__)))
#define EVAL4(...) EVAL3 (EVAL3 (EVAL3 (__VA_ARGS__)))

/// *******
/// EVAL 封装了上面所说的第三点
/// *******
#define EVAL(...)  EVAL4 (EVAL4 (EVAL4 (__VA_ARGS__))) 
```

### 一个例子

最后我们可以实现一个 ADD 宏，总结一下上面的内容。
这个 ADD 宏采用了循环递增的方法，并且判断了递归结束点，实现了图灵完备性。

```cpp
#define ADD_(x, y) IF(IS_ZERO(x), y, DEFER(ADD_BACK_)  (DEC(x), INC(y)))
#define ADD_BACK_(x,y) IF(IS_ZERO(x), y, DEFER(ADD_) (DEC(x), INC(y)))

#define ADD(x, y) EVAL(ADD_(x, y))
```


## 总结

这篇文章仅仅是揭示并解释了 C/C++ 的宏是图灵完备的，其实，有了上文提到的这些“原语”，C/C++ 的宏可以实现任何的计算任务。

由于 C/C++ 的一些不完善之处，比如 C++ 至今仍然不支持静态反射，虽然可以用模板实现一些类型上的计算，但是还是无法遍历结构体的成员，在一些库函数，比如 [visit_struct](https://github.com/cbeck88/visit_struct) 等项目中，这种技巧仍然还是有少量的用武之地的。

但是，由于宏处理器的局限，比如展开层数的限制，再加上宏一些反人类的设定，宏本就不应该被滥用，比如 linux 内核的 `min` 和 `max` 宏采用如此鲁棒的方法编写，依然存在 BUG（可以通过构造 `UNIQUE_ID_XXX` 的变量触发 ）。更何况，C++ 17 的 if constexpr 和 折叠表达式等特性，让模板元都渐渐的丧失了用武之地，用宏去做这些骚操作自然是显得舍本逐末，并且会造成代码可读性差、难以维护。更何况，不同的编译器的预处理器本身实现就有差别，例如示例代码无法在MSVC下编译，所以强烈不建议在项目中使用这种技巧。

最后，整个示例程序上传在 [gist](https://gist.github.com/jxlpzqc/9f628fd5ab22a2078c3f68c367e05cec) 上，在 Ubuntu 22.04，gcc 11 上编译通过，欢迎在评论区指出笔者对宏理解的错误和示例程序的BUG。


[^1]: [ppstep - 宏调试工具](https://github.com/notfoundry/ppstep/blob/master/src/ppstep.cpp)
[^2]: [宏替换 - cppreference](https://zh.cppreference.com/w/cpp/preprocessor/replace)
[^3]: [宏实现的参数格式重载 - StackOverflow](https://stackoverflow.com/questions/11761703/overloading-macro-on-number-of-arguments)
[^4]: [map-macro - GitHub](https://github.com/swansontec/map-macro)