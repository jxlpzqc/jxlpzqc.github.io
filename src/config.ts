export type Site = {
    website: string;
    author: string;
    desc: string;
    title: string;
    listLimitSize: number;
    ogImage: string;
    shHostname: string;
    shUsername: string;
    logo: string;
};

// use figlet to generate a logo
const logo = `  ___ _                     _
 / __| |_  ___ _ _  __ _ __(_)
| (__| ' \\/ -_) ' \\/ _\` |_ / |
 \\___|_||_\\___|_||_\\__, /__|_|
                   |___/
`;


export const SITE: Site = {
    website: "https://chengzi233.cn/", // replace this with your deployed domain
    author: "chengzi",
    desc: "",
    title: "Chengzi's blog",
    listLimitSize: 20,
    ogImage: "astropaper-og.jpg",
    shHostname: "blog",
    shUsername: "chengzi",
    logo: logo
};