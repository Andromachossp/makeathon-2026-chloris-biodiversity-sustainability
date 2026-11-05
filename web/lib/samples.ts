export interface SampleDef { id: string; file: string; result: string; label: string; title: string; author: string; licence: string; licenceUrl: string; source: string }

/** Sample photos for the demo. Licences were read from Wikimedia Commons file metadata; only CC0 and CC BY are used.
    The identification results were fetched once from Pl@ntNet and cached, so samples never use the API quota. */
export const SAMPLES: SampleDef[] = [
  { id: "salvia-fruticosa", file: "/samples/salvia-fruticosa.jpg", result: "/samples/salvia-fruticosa.result.json", label: "Greek sage", title: "Salvia fruticosa 2 RF.jpg", author: "Robert Flogaus-Faust", licence: "CC BY 4.0", licenceUrl: "https://creativecommons.org/licenses/by/4.0", source: "https://commons.wikimedia.org/wiki/File:Salvia_fruticosa_2_RF.jpg" },
  { id: "hypericum-perforatum", file: "/samples/hypericum-perforatum.jpg", result: "/samples/hypericum-perforatum.result.json", label: "St John's wort", title: "Hypericum perforatum, 2023-06-20, South Side, 01.jpg", author: "Cbaile19", licence: "CC0", licenceUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en", source: "https://commons.wikimedia.org/wiki/File:Hypericum_perforatum,_2023-06-20,_South_Side,_01.jpg" },
  { id: "origanum-dictamnus", file: "/samples/origanum-dictamnus.jpg", result: "/samples/origanum-dictamnus.result.json", label: "Cretan dittany", title: "Origanum dictamnus - Bergianska trädgården - Stockholm, Sweden - DSC00326.JPG", author: "Daderot", licence: "CC0", licenceUrl: "http://creativecommons.org/publicdomain/zero/1.0/deed.en", source: "https://commons.wikimedia.org/wiki/File:Origanum_dictamnus_-_Bergianska_tr%C3%A4dg%C3%A5rden_-_Stockholm,_Sweden_-_DSC00326.JPG" },
];
