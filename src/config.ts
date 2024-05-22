export type Site = {
    website: string;
    author: string;
    desc: string;
    title: string;
    listLimitSize: number;
    ogImage: string;
    shHostname: string;
    shUsername: string;
    /**
     * file extension name, such as '.md', '.html'
     */
    postExt: string;
    logoText?: string;
    /**
     * when logo image is provided, the logoText will be ignored
     */
    logoImg?: string | {
        dark: string,
        light: string
    };
    umamiWebsiteID?: string;
    giscus?: {
        repo: `${string}/${string}`,
        repoId: string,
        category: string,
        categoryId: string,
        lang: string
    }
};

// use figlet to generate a logo
const logoText = `  ___ _                     _
 / __| |_  ___ _ _  __ _ __(_)
| (__| ' \\/ -_) ' \\/ _\` |_ / |
 \\___|_||_\\___|_||_\\__, /__|_|
                   |___/
`;


export const SITE: Site = {
    website: "https://chengzi.tech/", // replace this with your deployed domain
    author: "chengzi",
    desc: "",
    title: "Chengzi's blog",
    listLimitSize: 20,
    ogImage: "astropaper-og.jpg",
    shHostname: "blog",
    shUsername: "chengzi",
    postExt: ".md",
    logoText: logoText,
    logoImg: {
        light: "/logo.svg",
        dark: "/logo-dark.svg"
    },
    umamiWebsiteID: "5a8f4e8b-5b23-4928-91a2-0ae51dce1926",
    giscus: {
        repo: "jxlpzqc/jxlpzqc.github.io",
        repoId: "R_kgDOL8VGJg",
        category: "Comments",
        categoryId: "DIC_kwDOL8VGJs4CfhyR",
        lang: "zh-CN",
    }
};