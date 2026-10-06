// A hand-picked Wikimedia Commons photograph of each club's ground, keyed like `CLUB_COLOURS`, with its credit.
// `/credits` prints the credits from this table, so a row with no `author` is a licence breach.
// Files under `public/ground/clubs/` are capped at 1920px on the long edge, never upscaled.

export interface GroundPhoto {
  /** Under `public/`, so `next/image` optimises it like any other asset. */
  src: string;
  /** The file's own name on Commons, which is what the credit line calls it. */
  title: string;
  /** Who took it. CC BY and CC BY-SA both require naming them. */
  author: string;
  /** The licence's short name, exactly as Commons publishes it. */
  licence: string;
  licenceUrl: string;
  /** The file's page on Commons — the "source" half of an attribution. */
  source: string;
  /** A 16px-wide inline JPEG placeholder: without it the ground blinks black as a club's Shell remounts. */
  blur: string;
}

/** What `/credits` prints for any photograph: who took it, under what terms, and where it came from. */
export type PhotoCredit = Pick<GroundPhoto, "title" | "author" | "licence" | "licenceUrl" | "source">;

const CLUB_GROUND_PHOTOS: Record<string, Omit<GroundPhoto, "src">> = {
  ARS: {
    title: "Arsenal Stadium - The Emirates 3",
    author: "Ronnie Macdonald",
    licence: "CC BY 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by/2.0",
    source:
      "https://commons.wikimedia.org/wiki/File:Arsenal_Stadium_-_The_Emirates_3.jpg",
    blur: "data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAgT/xAAgEAABBAEEAwAAAAAAAAAAAAABAAIDBBESEyExBSOB/8QAFAEBAAAAAAAAAAAAAAAAAAAAA//EABgRAQEAAwAAAAAAAAAAAAAAABEAASEx/9oADAMBAAIRAxEAPwCWezL5EE2LJ29WAxhxwhZp0oa25EMuHYL8khWwwRDqNo+JS14tDvW3kInL2bQF/9k=",
  },
  AVL: {
    title:
      "2007-05-05 Aston Villa v Sheffield United, Villa Park from the Holt End (2)",
    author: "Kolforn (Kolforn)",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source:
      "https://commons.wikimedia.org/wiki/File:-2007-05-05_Aston_Villa_v_Sheffield_United,_Villa_Park_from_the_Holt_End_(2).JPG",
    blur: "data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAAMABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABQIG/8QAHhAAAgICAgMAAAAAAAAAAAAAAQIAAwQRBkESITH/xAAVAQEBAAAAAAAAAAAAAAAAAAAAAv/EABkRAAIDAQAAAAAAAAAAAAAAAAABAhESIf/aAAwDAQACEQMRAD8ANqy1qIAdVC97i9HIcSrGUWXqGGx6Ewvmw7lqxNZ3r7InHXWxlXZ//9k=",
  },
  BHA: {
    title:
      "American Express Community Stadium, Falmer (August 2011) (Stadium Approach)",
    author: "Hassocks5489",
    licence: "CC0",
    licenceUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
    source:
      "https://commons.wikimedia.org/wiki/File:American_Express_Community_Stadium,_Falmer_(August_2011)_(Stadium_Approach).JPG",
    blur: "data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABAEG/8QAIBAAAgIBBAMBAAAAAAAAAAAAAQIDEQAEBRIhMUJRcf/EABUBAQEAAAAAAAAAAAAAAAAAAAID/8QAGBEAAwEBAAAAAAAAAAAAAAAAAAECEzH/2gAMAwEAAhEDEQA/AEnetulBMbTdfIjk0U+k10pCsy9+60T+XmXWWRDyR2U2ewax+3zPM1SnlXiwMelpdJ5yf//Z",
  },
  BOU: {
    title: "Away fans (Chelsea) - Vitality Stadium - geograph.org.uk - 7881638",
    author: "Mr Ignavy",
    licence: "CC BY-SA 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0",
    source:
      "https://commons.wikimedia.org/wiki/File:Away_fans_(Chelsea)_-_Vitality_Stadium_-_geograph.org.uk_-_7881638.jpg",
    blur: "data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAAMABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABAAF/8QAIBAAAgIBBAMBAAAAAAAAAAAAAQIDEQAEE1FhEiExM//EABQBAQAAAAAAAAAAAAAAAAAAAAD/xAAYEQADAQEAAAAAAAAAAAAAAAAAAQIhMf/aAAwDAQACEQMRAD8AyTO7xOC21Mp/OvovnLQyCKQ7ksZAFn1ddXzilnZ7RgpUVVjvEaTSwNLITEp8iLxVVW0wklw//9k=",
  },
  BRE: {
    title:
      "Line-up at the Brentford v Nottingham Forest football match on 21 December 2024 at Brentford Community Stadium",
    author: "Jim Linwood",
    licence: "CC BY 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by/2.0",
    source:
      "https://commons.wikimedia.org/wiki/File:Line-up_at_the_Brentford_v_Nottingham_Forest_football_match_on_21_December_2024_at_Brentford_Community_Stadium.jpg",
    blur: "data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAAMABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAwQF/8QAIBAAAgEEAgMBAAAAAAAAAAAAAQMCAAQRIQUSExQxcf/EABQBAQAAAAAAAAAAAAAAAAAAAAP/xAAZEQADAAMAAAAAAAAAAAAAAAAAAQIDMUH/2gAMAwEAAhEDEQA/AAXyDFwK3chenW/JMg0LGKmCfYuCD9zP7WIhzFWgdGcuxYIEE5BjgnGP2phct7E9tyO6B46eqDcVxn//2Q==",
  },
  CHE: {
    title: "Blues at Chelsea - Feb 2013 - Who Are Ya!",
    author: "Gareth Williams from Redhill, England",
    licence: "CC BY 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by/2.0",
    source:
      "https://commons.wikimedia.org/wiki/File:Blues_at_Chelsea_-_Feb_2013_-_Who_Are_Ya!_(8694352428).jpg",
    blur: "data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABAEC/8QAIhAAAgIBAgcBAAAAAAAAAAAAAQIDEQAFUQQSISMxQWGR/8QAFQEBAQAAAAAAAAAAAAAAAAAAAQL/xAAZEQACAwEAAAAAAAAAAAAAAAAAAQIDEjH/2gAMAwEAAhEDEQA/AMRafG69xkTYENkl05LIVoWJ6WA1j75xzOyyIFNXd/mD4wcsMtEilPs7YQs2uEo//9k=",
  },
  COV: {
    title: "Coventry Building Society Arena november 2025",
    author: "Asj1977",
    licence: "CC0",
    licenceUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en",
    source:
      "https://commons.wikimedia.org/wiki/File:Coventry_Building_Society_Arena_november_2025.jpg",
    blur: "data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAAKABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAwQG/8QAIRAAAQMDBAMAAAAAAAAAAAAAAQACAwQRMQUTIUFicaH/xAAVAQEBAAAAAAAAAAAAAAAAAAAAAf/EABgRAQADAQAAAAAAAAAAAAAAAAEAAgNC/9oADAMBAAIRAxEAPwCPT6t8YG46nI8nWPxNqFbJLEWwujbGc7cnJ9lZFjiCbE4Paa5uOTgqNtHqCpP/2Q==",
  },
  CRY: {
    title: "Crystal Palace vs. Norwich City (2019)",
    author: "FromMorningToMidnight",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source:
      "https://commons.wikimedia.org/wiki/File:Crystal_Palace_vs._Norwich_City_(2019).jpg",
    blur: "data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAAKABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABAID/8QAIhAAAQQABQUAAAAAAAAAAAAAAQACAxEEBRIVISIjMUGR/8QAFQEBAQAAAAAAAAAAAAAAAAAAAAT/xAAXEQEBAQEAAAAAAAAAAAAAAAABABED/9oADAMBAAIRAxEAPwCt2lIHY4925HmzKWQOZJhAIyOo6+a+I7CaWTib8qY6q5Nv/9k=",
  },
  EVE: {
    title: "Hilldickinsonstadium",
    author: "Everton FC",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source: "https://commons.wikimedia.org/wiki/File:Hilldickinsonstadium.jpg",
    blur: "data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAAJABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAwIF/8QAIRAAAQQBAwUAAAAAAAAAAAAAEQABAgMEBSFxIjEyM4H/xAAUAQEAAAAAAAAAAAAAAAAAAAAD/8QAGBEAAwEBAAAAAAAAAAAAAAAAAAISMRH/2gAMAwEAAhEDEQA/AAy9Qx4z6GaWxdwEOLqdNl0oWsIAlu54WJf5/FOL7H4T21aBK8w//9k=",
  },
  FUL: {
    title: "Craven Cottage - Apr 2015 - The Cottage with Bees Fans",
    author: "Gareth Williams from Redhill, England",
    licence: "CC BY 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by/2.0",
    source:
      "https://commons.wikimedia.org/wiki/File:Craven_Cottage_-_Apr_2015_-_The_Cottage_with_Bees_Fans_(17027950878).jpg",
    blur: "data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAAJABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAwQF/8QAIxAAAgEDAgcBAAAAAAAAAAAAAQIEAAMRBXMGIjEzNEHBUf/EABUBAQEAAAAAAAAAAAAAAAAAAAID/8QAFxEAAwEAAAAAAAAAAAAAAAAAAAECEf/aAAwDAQACEQMRAD8Ad+JLc6M6y4DMoGVW8Bhj7xWNKTT5MSQ1nT0sOByPbdiAcjqM/maCZ24W2ftS2PDO58FHSswmf//Z",
  },
  HUL: {
    title: "KC Stadium avant Hull-WestHam",
    author: "Chmoul",
    licence: "CC BY-SA 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/3.0",
    source:
      "https://commons.wikimedia.org/wiki/File:KC_Stadium_avant_Hull-WestHam.JPG",
    blur: "data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAAMABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABQID/8QAIRAAAgEDBAMBAAAAAAAAAAAAAQIDAAQREhMxQQUhoZH/xAAUAQEAAAAAAAAAAAAAAAAAAAAB/8QAFhEBAQEAAAAAAAAAAAAAAAAAAREA/9oADAMBAAIRAxEAPwDS/wDLXt42kSCFOlXP2izBrJyTI/PFKGUOpEsMUneSvv5UrDC94q7QC7ZfAJ5/aBpcEd//2Q==",
  },
  IPS: {
    title:
      "Ipswich Town vs Norwich City, Championship Play-Off Semi-Final 1st Leg, at Portman Road Stadium on 9th May 2015 05",
    author: "James Cracknell",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source:
      "https://commons.wikimedia.org/wiki/File:Ipswich_Town_vs_Norwich_City,_Championship_Play-Off_Semi-Final_1st_Leg,_at_Portman_Road_Stadium_on_9th_May_2015_05.jpg",
    blur: "data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAAMABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAABQb/xAAfEAACAQQDAQEAAAAAAAAAAAABAgQAAwUREiExUSL/xAAVAQEBAAAAAAAAAAAAAAAAAAABAv/EABcRAQEBAQAAAAAAAAAAAAAAAAEAAhH/2gAMAwEAAhEDEQA/ADcHKl41WMNFDOf05XZI+eVTw89PbiL0MPs6PHo1CJfuJdZUcqNnw0hHyMgvaUvsMO/tRpQ6S3//2Q==",
  },
  LEE: {
    title: "East Stand, Elland Road",
    author: "flickr user: wjarrettc",
    licence: "CC BY 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by/2.0",
    source:
      "https://commons.wikimedia.org/wiki/File:East_Stand,_Elland_Road.jpg",
    blur: "data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABAMG/8QAIBAAAgEDBAMAAAAAAAAAAAAAAQIDAAQRBQYSMWGR4f/EABUBAQEAAAAAAAAAAAAAAAAAAAAD/8QAGBEBAAMBAAAAAAAAAAAAAAAAAQADEQL/2gAMAwEAAhEDEQA/AHw7g1YrlrOFvYqr7mvIOJn04cWOMiX5WbtrqczLmVumHfmkvPKe3Y1JuBzIs5a3Gf/Z",
  },
  LIV: {
    title: "The kop - panoramio",
    author: "Tobias Barkskog",
    licence: "CC BY 3.0",
    licenceUrl: "https://creativecommons.org/licenses/by/3.0",
    source: "https://commons.wikimedia.org/wiki/File:The_kop_-_panoramio.jpg",
    blur: "data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAAMABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAABAX/xAAhEAACAQMDBQAAAAAAAAAAAAABAgMABDEFERIhQWFxof/EABUBAQEAAAAAAAAAAAAAAAAAAAID/8QAGBEBAAMBAAAAAAAAAAAAAAAAAQACESH/2gAMAwEAAhEDEQA/AB2+hTSgtIeI7Y3NHurCGFdlYu3g491Xht1mQlnkA44Dnaps4CjoMY+0C2ygFuk//9k=",
  },
  MCI: {
    title: "Etihad Stadium in Manchester",
    author: "Sarmad Yaseen",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source:
      "https://commons.wikimedia.org/wiki/File:Etihad_Stadium_in_Manchester.jpg",
    blur: "data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAAMABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABAEG/8QAIRAAAQMEAQUAAAAAAAAAAAAAAQIDEQAEBRJBBiFRocH/xAAVAQEBAAAAAAAAAAAAAAAAAAABAv/EABgRAAIDAAAAAAAAAAAAAAAAAAABERIh/9oADAMBAAIRAxEAPwBFpn77UEhhYjgx9qO9QZeZSGEjwET7msc24ttOyFEGmIvXk69wSeSKh3TyAP/Z",
  },
  MUN: {
    title: "2024 Super League Grand Final Crowds Congregating 03",
    author: "Hullian111",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source:
      "https://commons.wikimedia.org/wiki/File:2024_Super_League_Grand_Final_Crowds_Congregating_03.jpg",
    blur: "data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAAMABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAABgQF/8QAHxAAAgEEAwEBAAAAAAAAAAAAAQIDAAQFERIhMUGR/8QAFAEBAAAAAAAAAAAAAAAAAAAAAf/EABcRAQADAAAAAAAAAAAAAAAAAAAREiH/2gAMAwEAAhEDEQA/AEr5FYLWWV+yg2ADuhOUzU+RZhK3BFBKqPP36azo/ST3vXtTXJ4XCBQADrfVE6av/9k=",
  },
  NEW: {
    title: "Gallowgate (geograph 8011429)",
    author: "Anthony Foster",
    licence: "CC BY-SA 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/2.0",
    source:
      "https://commons.wikimedia.org/wiki/File:Gallowgate_(geograph_8011429).jpg",
    blur: "data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAAMABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAgMF/8QAHhAAAwACAwADAAAAAAAAAAAAAQIDABEEBSEicZH/xAAUAQEAAAAAAAAAAAAAAAAAAAAA/8QAFxEAAwEAAAAAAAAAAAAAAAAAAAERAv/aAAwDAQACEQMRAD8AqneVjZxarXiD8ToEkYa9+C7pCZOj4zJ4RmLVmA4897FJMSSBsEejX5g47NbnJJztQWP35vFDzD//2Q==",
  },
  NFO: {
    title: "Trent End City Ground August 2022",
    author: "Egghead06",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source:
      "https://commons.wikimedia.org/wiki/File:Trent_End_City_Ground_August_2022.jpeg",
    blur: "data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAABAX/xAAhEAABAwQBBQAAAAAAAAAAAAACAQMEABESITEFBhMiQf/EABUBAQEAAAAAAAAAAAAAAAAAAAID/8QAFxEBAQEBAAAAAAAAAAAAAAAAAgEAA//aAAwDAQACEQMRAD8AVI7lJp1QZh+YUTR581Pn9ecmxiYchCAnb3zvjvmmk6aNGqLZRTVTprzlnCy2hIia+XqI7VzIGK7/2Q==",
  },
  SUN: {
    title: "Stadium Light Sunderland 5",
    author: "Chabe01",
    licence: "CC BY-SA 4.0",
    licenceUrl: "https://creativecommons.org/licenses/by-sa/4.0",
    source:
      "https://commons.wikimedia.org/wiki/File:Stadium_Light_Sunderland_5.jpg",
    blur: "data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABADASIAAhEBAxEB/8QAFwAAAwEAAAAAAAAAAAAAAAAAAAEFBv/EAB8QAQABAwQDAAAAAAAAAAAAAAECABESAwQGIVFhcf/EABUBAQEAAAAAAAAAAAAAAAAAAAEC/8QAFhEAAwAAAAAAAAAAAAAAAAAAAAES/9oADAMBAAIRAxEAPwCs8k2+WMScnwRpQ5BttWXbOJe106rO4xvfEv8AKEAEC76oplSj/9k=",
  },
  TOT: {
    title: "Heading into the Tottenham Hotspur Stadium",
    author: "Daniel",
    licence: "CC BY 2.0",
    licenceUrl: "https://creativecommons.org/licenses/by/2.0",
    source:
      "https://commons.wikimedia.org/wiki/File:Heading_into_the_Tottenham_Hotspur_Stadium.jpg",
    blur: "data:image/jpeg;base64,/9j/2wBDABIMDRANCxIQDhAUExIVGywdGxgYGzYnKSAsQDlEQz85Pj1HUGZXR0thTT0+WXlaYWltcnNyRVV9hnxvhWZwcm7/2wBDARMUFBsXGzQdHTRuST5Jbm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm5ubm7/wAARCAALABADASIAAhEBAxEB/8QAFgABAQEAAAAAAAAAAAAAAAAAAwQF/8QAIRAAAgEDAwUAAAAAAAAAAAAAAQIDAAQREhQhIjFBYYH/xAAUAQEAAAAAAAAAAAAAAAAAAAAB/8QAFREBAQAAAAAAAAAAAAAAAAAAABH/2gAMAwEAAhEDEQA/AIdpArAC5C+eMUyQ25i0mUsoPPVj7RT20UcJKJg+iay9TIxVSQMdhQY//9k=",
  },
};

/** The photograph behind a club's own screens, or null (never a guess) for one with no picture yet. */
export function clubGroundPhoto(shortName: string): GroundPhoto | null {
  const photo = CLUB_GROUND_PHOTOS[shortName];
  return photo === undefined
    ? null
    : { ...photo, src: `/ground/clubs/${shortName}.jpg` };
}

/** Every ground photograph with its club's short name, for `/credits`; `src` is built by `clubGroundPhoto` alone. */
export function groundPhotoCredits(): readonly {
  shortName: string;
  photo: GroundPhoto;
}[] {
  return Object.keys(CLUB_GROUND_PHOTOS)
    .sort()
    .flatMap((shortName) => {
      const photo = clubGroundPhoto(shortName);
      return photo === null ? [] : [{ shortName, photo }];
    });
}
