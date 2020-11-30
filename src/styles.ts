import { fromCircle } from "ol/geom/Polygon"
import {css} from 'lit-element'
export const glcss = css`
form {
    font-family: Helvetica,Arial,sans-serif;
}

.blink {
    animation: blinker 1s linear infinite;
}

@keyframes blinker {
    50% {
        opacity: 0;
    }
}
`