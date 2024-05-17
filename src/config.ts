export type Site = {
    website: string;
    author: string;
    desc: string;
    title: string;
    listLimitSize: number;
    ogImage: string;

};

export const SITE: Site = {
    website: "https://chengzi233.cn/", // replace this with your deployed domain
    author: "Chengzi's blog",
    desc: "",
    title: "My Blog",
    listLimitSize: 20,
    ogImage: "astropaper-og.jpg",
};