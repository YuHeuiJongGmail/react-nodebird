// /util/produce.js 는 인터넷익스플로러에서 immer 사용이 되도록 하기 위해 설정함.
import produce, { enableES5, } from 'immer'; 

export default (...args) =>{
    enableES5();
    return produce(...args);

}