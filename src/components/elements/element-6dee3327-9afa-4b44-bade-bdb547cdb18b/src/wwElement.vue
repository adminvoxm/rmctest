<template>
    <div ref="iframe" class="ww-iframe" :class="{ isEditing: isEditing }">
        <iframe v-if="source" class="iframe-holder" :src="source" />
    </div>
</template>

<script>
export default {
    props: {
        content: { type: Object, required: true },
    },
    emits: ['update:content'],
    data() {
        return {
            reset: false,
        };
    },
    computed: {
        isEditing() {
            // eslint-disable-next-line no-unreachable
            return false;
        },
        source(){
            if(!this.content.source) return false;
            if(this.isValidHttpUrl){
                return this.content.source;
            }
            else {
                return `data:text/html;charset=utf-8,${encodeURIComponent(this.content.source)}`;
            }
        },
        isValidHttpUrl() {
            let url;

            try {
                url = new URL(this.content.source);
            } catch (_) {
                return false;
            }

            return url.protocol === 'http:' || url.protocol === 'https:' || url.protocol === 'data:';
        },
    },
};
</script>

<style lang="scss" scoped>
.ww-iframe {
    position: relative;
    isolation: isolate;
    .iframe-holder {
        position: absolute;
        height: 100%;
        width: 100%;
        border: none;
    }
}
</style>
