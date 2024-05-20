---
title: 简单理解 C++ 完美转发
pubDate: 2024-05-19
updatedDate: 2024-05-20
tags:
  - C++
repost: false
---

鉴于在网上看到一些博文，都没有讲清楚为什么要有完美转发，
所以我在阅读一些资料后，总结了一下，在此记录一下。

## 右值引用是左值

这是一个很让人感到费解的点，**右值引用是左值**。[^1]

这里引用《Effective Modern C++》中的一段话：

> 通常，判断左右值的方法是看其是否能取地址，如果能取地址，那么它就是左值，否则就是右值。

在下面的例子中，`a` 是一个右值引用，但是它可以取地址，所以它是左值。

```cpp
int main() {
    int&& a = 1;
    int* b = &a;
    *b = 2;
    std::cout << a << std::endl;
}
```

其实，引用的本质是地址，右值引用的本质也是地址，他绑定了一个临时对象。

但是为什么右值引用可以取地址，而右值不能取地址呢？

这是因为右值引用把该临时对象的生存期延长到了右值引用的生存期。所以在右值引用的生存期内，该临时对象是存在的。存在的对象是可以取地址的，所以右值引用是左值。

## 为什么要有完美转发

所以，这里就引出了为什么要有完美转发。

首先，看下面的例子中的 `test1`，由于 `int&` 只能绑定左值，而 `int&&` 只能绑定右值，
所以 `f(1)` 会调用 `f(int&&)`，`f(a)` 会调用 `f(int&)`。

```cpp
void f(int& a) {
    std::cout << "lvalue" << std::endl;
}

void f(int&& a) {
    std::cout << "rvalue" << std::endl;
}

int test1() {
    int a = 1;
    f(a); // f(int&)
    f(1); // f(int&&)
}

int test2() {
    int m = 1;
    int &&a = 1;
    int &b = m;
    f(a); // f(int&)
    f(b); // f(int&)
}
```

而在 `test2` 中，`f(a)` 会调用 `f(int&)`，这是因为 `a` 是一个左值。

所以我们需要一个函数，让右值引用可以表现为右值（或者换句话说，把右值引用转换为右值，即调用 `std::move()` ），左值引用可以表现为左值。

另外提一嘴，这个所需要的函数在设计模板函数或者模板类时，是非常有用的。

## std::forward()

标准库提供了一个这样的函数, 即 `std::forward()`。

看一眼 MSVC 的实现：

```cpp
template<class T>
constexpr T&& forward(std::remove_reference_t<T>& arg) noexcept{
    // forward an lvalue as either an lvalue or an rvalue
    return (static_cast<T&&>(arg));
}

template<class T>
constexpr T&& forward(std::remove_reference_t<T>&& arg) noexcept{
    // forward an rvalue as an rvalue
    return (static_cast<T&&>(arg));
}
```

下面，我们用 `forward(1)`， `forward(a)`，`forward(b)` 来分析一下模板实例化的过程 （其中 a，b 来自上面例子的 test2 ，a 是右值引用，b 是左值引用）：

首先看第二个函数，右值引用只能接受右值，当 `forward` 一个右值， 比如 `forword(1)` 的时候，会调用这个重载。模板实例化时，`T&&` 会被实例化为 `int && &&` ，根据引用折叠规则，等于 `int &&` 。

至于什么是引用折叠规则呢，可以参考 cppreference [^2]，简单来说，只有模板展开时，只有 `&& &&` 等于右值引用，其他的都等于左值引用。

> ```cpp
> lref&  r1 = n; // r1 的类型是 int&
> lref&& r2 = n; // r2 的类型是 int&
> rref&  r3 = n; // r3 的类型是 int&
> rref&& r4 = 1; // r4 的类型是 int&&
> ```

可能这个时候又会有人抬杠了，“诶，你这个返回的不是右值引用吗？**可是右值引用是左值啊。怎么 `forward` 一个右值，得到了左值呢？**”

是的，右值引用是左值，在 `forward` 函数作用域内，都可以看作是左值，但是 C++ 函数调用表达式有个规则，如果返回值的不是左值引用，那么函数调用表达式是个右值。

所以 `forward(1)` 这个表达式是一个右值。

当然，最关键的实现是第一个函数（一般很少会 forward 一个右值），我们先说一下 `forward(a)` 的情况，当T是`int&&`时，`static_cast<T&&>(arg)`中 T&& 会实例化为`int&& &&`，根据引用折叠规则 折叠为 `int&&`。再根据函数调用表达式的规则，`forward(a)` 是右值。

而 `forward(b)` 在实例化以后，返回的是 int&，而返回值是左值引用的调用表达式是左值，所以 `forward(b)`是左值。

根据上面的分析：

- `forward(1)` -> 右值
- `forward(a)` -> 右值
- `forward(b)` -> 左值

## 完美转发的使用

通常来说，在编写模板函数的时候，完美转发需要配合转发引用（万能引用）一起使用，实现完美转发，下面是一个例子：

```cpp
template<typename... Ts>
void fwd(Ts&&... params)            //接受任何实参
{
    f(std::forward<Ts>(params)...); //转发给f
}
```

像这种新式，在STL的 `emplace` 函数可以经常见到。

## 完美转发并不完美

但是，令人遗憾的是，`std::forward` 并不是总是能完美的，《Effective Mordern C++》的第30条款 [^3] 里面详细介绍了这种情况，但是由于我才学疏浅，这里就不展开了。

[^1]: [值类别 - cppreference](https://zh.cppreference.com/w/cpp/language/value_category#.E5.B7.A6.E5.80.BC)
[^2]: [引用声明 - cppreference](https://zh.cppreference.com/w/cpp/language/reference)
[^3]: [熟悉完美转发失败的情况 - Effective Modern C++](https://cntransgroup.github.io/EffectiveModernCppChinese/5.RRefMovSemPerfForw/item30.html)