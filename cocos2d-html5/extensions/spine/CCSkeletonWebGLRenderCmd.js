/****************************************************************************
 Copyright (c) 2013-2014 Chukong Technologies Inc.

 http://www.cocos2d-x.org

 Permission is hereby granted, free of charge, to any person obtaining a copy
 of this software and associated documentation files (the "Software"), to deal
 in the Software without restriction, including without limitation the rights
 to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 copies of the Software, and to permit persons to whom the Software is
 furnished to do so, subject to the following conditions:

 The above copyright notice and this permission notice shall be included in
 all copies or substantial portions of the Software.

 THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 THE SOFTWARE.
 ****************************************************************************/

(function()
{

    var RenderState = function(blendFunc, atlas, begin)
    {
        this.blendFunc = blendFunc;
        this.atlas = atlas;
        this.begin = begin;
    };

    RenderState.prototype.draw = function()
    {
        cc.glBlendFunc(this.blendFunc.src, this.blendFunc.dst);
        this.atlas.drawNumberOfQuads(this.count, this.begin);
    };

    RenderState.prototype.compare = function(blendFunc, atlas)
    {
        return (this.blendFunc.dst === blendFunc.dst) && (this.blendFunc.src === blendFunc.src) && (this.atlas === atlas);
    };

    var RenderStateManager = function()
    {
        this.states = [];
        this.quad = new cc.V3F_C4B_T2F_Quad();
    };

    // todo: need to discover other blending modes
    RenderStateManager.blending = {
        /**
         * additive blending;
         * according to Spine documentation, this should use premultiplied alpha
         */
        1: { src: cc.ONE, dst: cc.ONE }
    };

/*
    RenderStateManager.blending = {
        'additive': {src: cc.ONE, dst: cc.ONE},
        'multiply': {src: cc.DST_COLOR, dst: cc.ONE_MINUS_SRC_ALPHA},
        'screen': {src: cc.ONE, dst: cc.ONE_MINUS_SRC_COLOR},
        'prealpha': {src: cc.ONE, dst: cc.ONE_MINUS_SRC_ALPHA}
    };
*/

    RenderStateManager.prototype.flush = function()
    {
        var states = this.states,
            length = this.states.length,
            i;
        if(states.length > 0)
        {
            var top = states[states.length - 1];
            top.count = top.atlas.getTotalQuads() - top.begin;
        }
        for(i = 0; i < length; ++i)
        {
            states[i].draw();
        }

        for(i = 0; i < length; ++i)
        {
            states[i].atlas._totalQuads = 0;
        }
        this.states.length = 0;
    };

    RenderStateManager.prototype.begin = function(blendFunc, atlas)
    {
        var current = this.states.length === 0 ? null : this.states[this.states.length - 1];
        if(current === null || !current.compare(blendFunc, atlas))
        {
            if(current !== null)
            {
                current.count = current.atlas.getTotalQuads() - current.begin;
            }
            this.states.push(new RenderState(blendFunc, atlas, atlas.getTotalQuads()));
        }
        //else do nothing
    };

    RenderStateManager.prototype.writeQuads = function(vertices, uvs, color)
    {
        var top = this.states[this.states.length - 1];
        var atlas = top.atlas;

        var quadsCount = vertices.length / 8;
        if(atlas.getTotalQuads() + quadsCount >= atlas.getCapacity())
        {
            var newCapacity = Math.max(atlas.getCapacity() * 2, atlas.getCapacity() + quadsCount);
            atlas.resizeCapacity(newCapacity);
        }
        var quad = this.quad;

        quad.bl.colors.r = quad.tl.colors.r = quad.tr.colors.r = quad.br.colors.r = color.r;
        quad.bl.colors.g = quad.tl.colors.g = quad.tr.colors.g = quad.br.colors.g = color.g;
        quad.bl.colors.b = quad.tl.colors.b = quad.tr.colors.b = quad.br.colors.b = color.b;
        quad.bl.colors.a = quad.tl.colors.a = quad.tr.colors.a = quad.br.colors.a = color.a;

        var VERTEX = sp.VERTEX_INDEX;
        for(var i = 0; i < quadsCount; ++i)
        {
            var offset = i * 8;
            quad.bl.vertices.x = vertices[offset + VERTEX.X1];
            quad.bl.vertices.y = vertices[offset + VERTEX.Y1];
            quad.tl.vertices.x = vertices[offset + VERTEX.X2];
            quad.tl.vertices.y = vertices[offset + VERTEX.Y2];
            quad.tr.vertices.x = vertices[offset + VERTEX.X3];
            quad.tr.vertices.y = vertices[offset + VERTEX.Y3];
            quad.br.vertices.x = vertices[offset + VERTEX.X4];
            quad.br.vertices.y = vertices[offset + VERTEX.Y4];

            quad.bl.texCoords.u = uvs[offset + VERTEX.X1];
            quad.bl.texCoords.v = uvs[offset + VERTEX.Y1];
            quad.tl.texCoords.u = uvs[offset + VERTEX.X2];
            quad.tl.texCoords.v = uvs[offset + VERTEX.Y2];
            quad.tr.texCoords.u = uvs[offset + VERTEX.X3];
            quad.tr.texCoords.v = uvs[offset + VERTEX.Y3];
            quad.br.texCoords.u = uvs[offset + VERTEX.X4];
            quad.br.texCoords.v = uvs[offset + VERTEX.Y4];

            atlas.updateQuad(quad, atlas.getTotalQuads());
        }
    };

    RenderStateManager.prototype.writeTriangles = function(triangles, vertices, uvs, color)
    {
        var top = this.states[this.states.length - 1];
        var atlas = top.atlas;

        var trisCount = triangles.length / 3;
        if(atlas.getTotalQuads() + trisCount > atlas.getCapacity())
        {
            var newCapacity = Math.max(atlas.getCapacity() * 2, atlas.getCapacity() + trisCount);
            atlas.resizeCapacity(newCapacity);
        }
        var quad = this.quad;

        quad.bl.colors.r = quad.tl.colors.r = quad.tr.colors.r = quad.br.colors.r = color.r;
        quad.bl.colors.g = quad.tl.colors.g = quad.tr.colors.g = quad.br.colors.g = color.g;
        quad.bl.colors.b = quad.tl.colors.b = quad.tr.colors.b = quad.br.colors.b = color.b;
        quad.bl.colors.a = quad.tl.colors.a = quad.tr.colors.a = quad.br.colors.a = color.a;

        for(var i = 0; i < trisCount; ++i)
        {
            var v0i = triangles[i * 3] * 2;
            var v1i = triangles[i * 3 + 1] * 2;
            var v2i = triangles[i * 3 + 2] * 2;

            quad.bl.vertices.x = vertices[v0i];
            quad.bl.vertices.y = vertices[v0i + 1];
            quad.tl.vertices.x = vertices[v1i];
            quad.tl.vertices.y = vertices[v1i + 1];
            quad.tr.vertices.x = vertices[v2i];
            quad.tr.vertices.y = vertices[v2i + 1];

            quad.br.vertices.x = vertices[v0i];
            quad.br.vertices.y = vertices[v0i + 1];


            quad.bl.texCoords.u = uvs[v0i];
            quad.bl.texCoords.v = uvs[v0i + 1];
            quad.tl.texCoords.u = uvs[v1i];
            quad.tl.texCoords.v = uvs[v1i + 1];
            quad.tr.texCoords.u = uvs[v2i];
            quad.tr.texCoords.v = uvs[v2i + 1];

            quad.br.texCoords.u = uvs[v0i];
            quad.br.texCoords.v = uvs[v0i + 1];


            atlas.updateQuad(quad, atlas.getTotalQuads());
        }
    };


    sp.Skeleton.WebGLRenderCmd = function(renderableObject)
    {
        cc.Node.WebGLRenderCmd.call(this, renderableObject);
        this._needDraw = true;
         this._matrix = new cc.math.Matrix4();
         this._matrix.identity();
        this.setShaderProgram(cc.shaderCache.programForKey(cc.SHADER_POSITION_TEXTURECOLOR));
        this._tmpQuad = new cc.V3F_C4B_T2F_Quad();
    };

    var proto = sp.Skeleton.WebGLRenderCmd.prototype = Object.create(cc.Node.WebGLRenderCmd.prototype);
    proto.constructor = sp.Skeleton.WebGLRenderCmd;

    proto.renderSkeleton = function(ctx, states, node, skeleton)
    {
        var attachment, slot, i, n;
        var locBlendFunc = node._blendFunc;

        for(i = 0, n = skeleton.drawOrder.length; i < n; i++)
        {
            slot = skeleton.drawOrder[i];
            if(!slot.attachment)
            {
                continue;
            }
            attachment = slot.attachment;

            if(slot.attachment.type === sp.ATTACHMENT_TYPE.SKELETON)
            {
                var nested = slot.attachment.node;
                this._updateNestedSkeletonTransform(slot.attachment, slot);

                var skel = nested._skeleton;
                var nodeColor = node.color;
                skel.r = nodeColor.r / 255.0;
                skel.g = nodeColor.g / 255.0;
                skel.b = nodeColor.b / 255.0;
                skel.a = node.getDisplayedOpacity() / 255.0;

                this.renderSkeleton(ctx, states, nested, skel);

                continue;
            }

            var blending = RenderStateManager.blending[slot.data.blendMode] || locBlendFunc || RenderStateManager['prealpha'];

            var atlas = node.getTextureAtlas(attachment);
            states.begin(blending, atlas);

            var color = this._getAttachmentColor(slot, node._premultipliedAlpha);

            switch(slot.attachment.type)
            {
                case sp.ATTACHMENT_TYPE.REGION :
                    this._drawRegionAttachment(states, attachment, slot, color);
                    break;
                case sp.ATTACHMENT_TYPE.MESH :
                    this._drawMeshAttachment(states, attachment, slot, color);
                    break;
                case sp.ATTACHMENT_TYPE.SKINNED_MESH :
                    this._drawSkinnedMeshAttachment(states, attachment, slot, color);
                    break;
            }
        }

    };

    proto.rendering = function(ctx)
    {
        var node = this._node;

         var wt = this._worldTransform;
         this._matrix.mat[0] = wt.a;
         this._matrix.mat[4] = wt.c;
         this._matrix.mat[12] = wt.tx;
         this._matrix.mat[1] = wt.b;
         this._matrix.mat[5] = wt.d;
         this._matrix.mat[13] = wt.ty;

         this._shaderProgram.use();
         this._shaderProgram._setUniformForMVPMatrixWithMat4(this._matrix);

        var states = new RenderStateManager();

        var skeleton = node._skeleton;
        var color = node.color;
        skeleton.r = color.r / 255.0;
        skeleton.g = color.g / 255.0;
        skeleton.b = color.b / 255.0;
        skeleton.a = node.getDisplayedOpacity() / 255.0;

        this.renderSkeleton(ctx, states, node, skeleton);
        states.flush();
    };

    proto._createChildFormSkeletonData = function()
    {
    };

    proto._updateChild = function()
    {
    };

    proto._getAttachmentColor = function(slot, premultipliedAlpha)
    {
        var skeleton = slot.bone.skeleton;
        var r = skeleton.r * slot.r * 255,
            g = skeleton.g * slot.g * 255,
            b = skeleton.b * slot.b * 255,
            normalizedAlpha = skeleton.a * slot.a;

        if(premultipliedAlpha)
        {
            r *= normalizedAlpha;
            g *= normalizedAlpha;
            b *= normalizedAlpha;
        }
        var a = normalizedAlpha * 255;

        return {r: r, g: g, b: b, a: a};
    };

    proto._drawRegionAttachment = function(states, attachment, slot, color)
    {
        var vertices = [];
        attachment.computeVertices(slot.bone.skeleton.x, slot.bone.skeleton.y, slot.bone, vertices);
        states.writeQuads(vertices, attachment.uvs, color);
    };

    proto._drawMeshAttachment = function(states, attachment, slot, color)
    {
        var vertices = [];
        attachment.computeWorldVertices(slot.bone.skeleton.x, slot.bone.skeleton.y, slot, vertices);
//        states.writeQuads(vertices, attachment.uvs, color);
        states.writeTriangles(attachment.triangles, vertices, attachment.uvs, color);
    };

    proto._drawSkinnedMeshAttachment = function(states, attachment, slot, color)
    {
        var vertices = [];
        var triangles = attachment.triangles;
        attachment.computeWorldVertices(slot.bone.skeleton.x, slot.bone.skeleton.y, slot, vertices);
        states.writeTriangles(triangles, vertices, attachment.uvs, color);
    };

    proto._updateNestedSkeletonTransform = function(self, slot)
    {
        var bone = slot.bone;
        var skeleton = self.node._skeleton;
        var root = skeleton.getRootBone();
        root.x = bone.worldX;
        root.y = bone.worldY;
        root.scaleX = bone.worldScaleX;
        root.scaleY = bone.worldScaleY;
        root.rotation = bone.worldRotation;
        skeleton.updateWorldTransform();
    };
})();
