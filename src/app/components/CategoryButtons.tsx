'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Button, Skeleton } from '@nextui-org/react';
import axios from 'axios';
import { useRouter, useSearchParams } from 'next/navigation';
import debounce from 'lodash/debounce';
import { FixedSizeList as List } from 'react-window';

const tokenListsBaseURL = 'https://raw.githubusercontent.com/viaprotocol/tokenlists/main/tokenlists/';
const defaultToken = 'https://e7.pngegg.com/pngimages/710/778/png-clipart-question-mark-question-mark.png';

export type GetTokensResponseData = Token[];

export interface Token {
    symbol: string;
    name: string;
    address: string;
    decimals: number;
    chainId: number;
    logoURI: string;
    coingeckoId?: string;
    listedIn: string[];
}

const CategoryButtons: React.FC = () => {
    const router = useRouter();
    const searchParams = useSearchParams();
    const category = searchParams.get('category') || '';
    const searchQuery = searchParams.get('searchQuery') || '';

    const [serverCategories, setServerCategories] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string>(category || '');
    const [tokens, setTokens] = useState<Token[]>([]);
    const [loading, setLoading] = useState<boolean>(false);
    const [searchInput, setSearchInput] = useState<string>(searchQuery);
    const [cache, setCache] = useState<{ [key: string]: Token[] }>({});

    useEffect(() => {
        const fetchCategories = async () => {
            if (serverCategories.length === 0) {
                try {
                    const response = await axios.get('https://api.github.com/repos/viaprotocol/tokenlists/contents/tokenlists');
                    const categoryFiles = response.data.map((file: any) => file.name.replace('.json', ''));
                    setServerCategories(categoryFiles);
                    if (!category || !categoryFiles.includes(category)) {
                        const defaultCategory = categoryFiles[0] || '';
                        setSelectedCategory(defaultCategory);
                        router.push(`/?category=${defaultCategory}&searchQuery=${searchInput}`);
                    }
                } catch (err) {
                    console.error('Failed to fetch categories', err);
                }
            }
        };
        fetchCategories();
    }, [category, router, searchInput, serverCategories]);

    const fetchTokens = async (category: string) => {
        if (cache[category]) {
            setTokens(cache[category]);
            return;
        }

        try {
            setLoading(true);
            const response = await axios.get<Token[]>(`${tokenListsBaseURL}${category}.json`);
            const checkedTokens = response.data.map((token) => {
                if (token.logoURI === null) {
                    return { ...token, logoURI: defaultToken };
                }
                return token;
            });

            setCache((prevCache) => ({ ...prevCache, [category]: checkedTokens }));
            setTokens(checkedTokens);
            setLoading(false);
        } catch (err) {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (selectedCategory) {
            fetchTokens(selectedCategory);
        }
    }, [selectedCategory]);

    useEffect(() => {
        if (category !== selectedCategory) {
            setSelectedCategory(category || '');
        }
        if (searchQuery !== searchInput) {
            setSearchInput(searchQuery || '');
        }
    }, [category, searchQuery]);

    const handleCategoryChange = (category: string) => {
        setSelectedCategory(category);
        router.push(`/?category=${category}&searchQuery=${searchInput}`);
    };

    useEffect(() => {
        if (selectedCategory) {
            router.push(`/?category=${selectedCategory}&searchQuery=${searchQuery}`);
        }
    }, [selectedCategory, searchQuery, router]);

    const debouncedSearchChange = useCallback(debounce((value: string) => {
        setSearchInput(value);
        router.push(`/?category=${selectedCategory}&searchQuery=${value}`);
    }, 0), [selectedCategory, router]);

    const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        debouncedSearchChange(event.target.value);
    };

    const filteredTokens = tokens.filter((token) =>
        token.name.toLowerCase().includes(searchInput.toLowerCase()) ||
        token.symbol.toLowerCase().includes(searchInput.toLowerCase())
    );

    const handleTokenError = (event: React.SyntheticEvent<HTMLImageElement, Event>) => {
        event.currentTarget.src = defaultToken;
    };

    const Row = ({ index, style }: { index: number; style: React.CSSProperties }) => {
        const tokensPerRow = 10;  
        const tokenIndex = index * tokensPerRow;

        return (
            <div style={style} className="flex flex-wrap justify-center gap-[18px] xl:gap-[22px]">
                {filteredTokens.slice(tokenIndex, tokenIndex + tokensPerRow).map((token, idx) => (
                    <div key={idx} className="w-24 h-24 relative overflow-hidden cursor-pointer transition-transform duration-700 ease-in-out hover:scale-110 hover:shadow-lg rounded-[50%] bg-[#f0f0f0] border border-[#cccccc]">
                        <img src={token.logoURI} alt={`Token ${idx + 1}`} className="w-full h-full object-cover" onError={handleTokenError} />
                    </div>
                ))}
            </div>
        );
    };

    return (
        <div>
            <div className="text-center justify-center flex">
                <h1 className="h-[90px] text-[#051c33] text-[64px] font-semibold mt-[30px] mb-[40px]">Token Lists</h1>
            </div>

            <div className="flex justify-center">
                <input type="text" placeholder="Search..." className="rounded min-w-fit w-[369px] bg-gray-100" 
                value={searchInput} onChange={handleSearchChange} />
                <Button className="min-w-fit w-16 h-10 rounded-e-lg cursor-pointer bg-[#051c33]" disabled>
                    <svg height="32" width="32">
                        <path
                            d="M19.427 21.427a8.5 8.5 0 1 1 2-2l5.585 5.585c.55.55.546 1.43 0 1.976l-.024.024a1.399 1.399 0 0 1-1.976 0l-5.585-5.585zM14.5 21a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13z"
                            fill="#ffffff"
                            fillRule="evenodd"
                        ></path>
                    </svg>
                </Button>
            </div>

            <div className="flex flex-wrap justify-center m-[40px] gap-5 sm:gap-3">
                {serverCategories.map((category) => (
                    <Button key={category} className={`w-[150px] h-[28px] px-4 rounded text-[16px] ${selectedCategory === category ? 'bg-zinc-500' : 'bg-[#051C33]'} text-white`} 
                        onClick={() => handleCategoryChange(category)}>
                        {category}
                    </Button>
                ))}
            </div>

            <div className="w-[1200px] mx-auto px-5 pb-8 sm:w-full md:w-full lg:w-full xl:w-full">
                <h2 className="text-center text-[32px] text-[#051c33] font-semibold mt-[52px] mx-0 mb-8">
                    {selectedCategory} token library
                </h2>

                {loading ? (
                    <div className="flex flex-wrap justify-center gap-10">
                        {Array.from({ length: 10 }).map((_, index) => (
                            <Skeleton key={index} className="w-24 h-24 rounded-[50%]" />
                        ))}
                    </div>
                ) : filteredTokens.length === 0 ? (
                    <p className="text-center">No tokens available for this category.</p>
                ) : (
                    <List
                        height={355} 
                        itemCount={Math.ceil(filteredTokens.length / 10)} 
                        itemSize={130}
                        width="100%"
                    >
                        {Row}
                    </List>
                )}
            </div>
        </div>
    );
};

export default CategoryButtons;
