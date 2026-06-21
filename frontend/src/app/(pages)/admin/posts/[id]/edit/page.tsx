"use client";

import { AdminBackLink } from "@/components/admin/admin-back-link";
import { AdminLoadingState, AdminMessageState } from "@/components/admin/admin-states";
import { PostForm, PostFormValues } from "@/components/admin/post-form";
import { useAuth } from "@/contexts/auth";
import { getAdminPosts, updatePost } from "@/http/post";
import { Post } from "@/types/post";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";

const EditPostPage = () => {
  const { user, getToken } = useAuth();
  const token = getToken();
  const router = useRouter();
  const params = useParams();
  const idParam = Array.isArray(params.id) ? params.id[0] : params.id;
  const postId = Number.parseInt(idParam ?? "");

  const [post, setPost] = useState<Post | null>(null);
  const [title, setTitle] = useState("");
  const [slug, setSlug] = useState("");
  const [content, setContent] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [coverImage, setCoverImage] = useState("");
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    if (!token) return;

    const fetchPost = async () => {
      try {
        setFetching(true);
        const response = await getAdminPosts(token, 1, 100);
        const foundPost = response.data.find((p) => p.id === postId);
        if (foundPost) {
          setPost(foundPost);
          setTitle(foundPost.title);
          setSlug(foundPost.slug);
          setContent(foundPost.content);
          setExcerpt(foundPost.excerpt || "");
          setCoverImage(foundPost.coverImage || "");
        }
      } catch (error) {
        console.error("Failed to fetch post:", error);
      } finally {
        setFetching(false);
      }
    };

    fetchPost();
  }, [token, postId]);

  if (!user) {
    return <AdminLoadingState label="Loading..." />;
  }

  if (user.role !== "admin" && user.role !== "writer") {
    return (
      <AdminMessageState
        tone="destructive"
        title="Access Denied"
        description="You must be a writer or administrator to access this page."
      />
    );
  }

  if (fetching) {
    return <AdminLoadingState label="Loading article..." />;
  }

  if (!post) {
    return (
      <AdminMessageState
        title="Article Not Found"
        description="The article you are looking for does not exist."
      >
        <AdminBackLink href="/admin/posts" label="Back to Articles" />
      </AdminMessageState>
    );
  }

  const handleField = <K extends keyof PostFormValues>(field: K, value: PostFormValues[K]) => {
    const setters: Record<keyof PostFormValues, (v: string) => void> = {
      title: setTitle,
      slug: setSlug,
      excerpt: setExcerpt,
      coverImage: setCoverImage,
      content: setContent,
    };
    setters[field](value);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setLoading(true);
      await updatePost(
        postId,
        {
          title,
          slug,
          content,
          excerpt: excerpt || undefined,
          coverImage: coverImage || undefined,
        },
        token
      );
      router.push("/admin/posts");
    } catch (error) {
      console.error("Failed to update post:", error);
      alert("Failed to update article");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl animate-in fade-in slide-in-from-bottom-2 py-8 duration-300">
      <AdminBackLink href="/admin/posts" label="Back to List" />

      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Edit article</p>
        <h1 className="mt-1 text-2xl font-extrabold tracking-tight text-foreground">{post.title}</h1>
      </div>

      <PostForm
        values={{ title, slug, excerpt, coverImage, content }}
        onField={handleField}
        onSubmit={handleSubmit}
        submitting={loading}
        submitLabel={loading ? "Updating..." : "Update Article"}
      />
    </div>
  );
};

export default EditPostPage;
