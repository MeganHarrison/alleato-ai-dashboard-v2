# Trace a RAG application

In this tutorial, we'll build a simple RAG application using the OpenAI SDK. We'll add observability to the application at each stage of development, from prototyping to production.

<CodeGroup>
  ```python Python
  from openai import OpenAI
  openai_client = OpenAI()

# This is the retriever we will use in RAG

# This is mocked out, but it could be anything we want

  def retriever(query: str):
      results = ["Harrison worked at Kensho"]
      return results

# This is the end-to-end RAG chain

# It does a retrieval step then calls OpenAI

  def rag(question):
      docs = retriever(question)
      system_message = """Answer the users question using only the provided information below:
          {docs}""".format(docs="\n".join(docs))

      return openai_client.chat.completions.create(
          messages=[
              {"role": "system", "content": system_message},
              {"role": "user", "content": question},
          ],
          model="gpt-4o-mini",
      )

  ```

  ```typescript TypeScript
  import { OpenAI } from "openai";
  const openAIClient = new OpenAI();

  // This is the retriever we will use in RAG
  // This is mocked out, but it could be anything we want
  async function retriever(query: string) {
    return ["This is a document"];
  }

  // This is the end-to-end RAG chain.
  // It does a retrieval step then calls OpenAI
  async function rag(question: string) {
    const docs = await retriever(question);

    const systemMessage =
      "Answer the users question using only the provided information below:\n\n" +
      docs.join("\n");

    return await openAIClient.chat.completions.create({
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: question },
      ],
      model: "gpt-4o-mini",
    });
  }
  ```

</CodeGroup>

## Prototyping

Having observability set up from the start can help you iterate **much** more quickly than you would otherwise be able to. It allows you to have great visibility into your application as you are rapidly iterating on the prompt, or changing the data and models you are using. In this section we'll walk through how to set up observability so you can have maximal observability as you are prototyping.

### Set up your environment

First, create an API key by navigating to the [settings page](https://smith.langchain.com/settings).

Next, install the LangSmith SDK:

<CodeGroup>
  ```bash Python SDK
  pip install langsmith
  ```

  ```bash TypeScript SDK
  npm install langsmith
  ```

</CodeGroup>

Finally, set up the appropriate environment variables. This will log traces to the `default` project (though you can easily change that).

```bash
export LANGSMITH_TRACING=true
export LANGSMITH_API_KEY=<your-api-key>
export LANGSMITH_WORKSPACE_ID=<your-workspace-id>
export LANGSMITH_PROJECT=default
```

<Note>
  You may see these variables referenced as `LANGCHAIN_*` in other places. These are all equivalent, however the best practice is to use `LANGSMITH_TRACING`, `LANGSMITH_API_KEY`, `LANGSMITH_PROJECT`.

  The `LANGSMITH_PROJECT` flag is only supported in JS SDK versions >= 0.2.16, use `LANGCHAIN_PROJECT` instead if you are using an older version.
</Note>

### Trace your LLM calls

The first thing you might want to trace is all your OpenAI calls. After all, this is where the LLM is actually being called, so it is the most important part! We've tried to make this as easy as possible with LangSmith by introducing a dead-simple OpenAI wrapper. All you have to do is modify your code to look something like:

<CodeGroup>
  ```python Python
  from openai import OpenAI
  from langsmith.wrappers import wrap_openai
  openai_client = wrap_openai(OpenAI())

# This is the retriever we will use in RAG

# This is mocked out, but it could be anything we want

  def retriever(query: str):
      results = ["Harrison worked at Kensho"]
      return results

# This is the end-to-end RAG chain

# It does a retrieval step then calls OpenAI

  def rag(question):
      docs = retriever(question)
      system_message = """Answer the users question using only the provided information below:
          {docs}""".format(docs="\n".join(docs))

      return openai_client.chat.completions.create(
          messages=[
              {"role": "system", "content": system_message},
              {"role": "user", "content": question},
          ],
          model="gpt-4o-mini",
      )

  ```

  ```typescript TypeScript
  import { OpenAI } from "openai";
  import { wrapOpenAI } from "langsmith/wrappers";
  const openAIClient = wrapOpenAI(new OpenAI());

  // This is the retriever we will use in RAG
  // This is mocked out, but it could be anything we want
  async function retriever(query: string) {
    return ["This is a document"];
  }

  // This is the end-to-end RAG chain.
  // It does a retrieval step then calls OpenAI
  async function rag(question: string) {
    const docs = await retriever(question);

    const systemMessage =
      "Answer the users question using only the provided information below:\n\n" +
      docs.join("\n");

    return await openAIClient.chat.completions.create({
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: question },
      ],
      model: "gpt-4o-mini",
    });
  }
  ```

</CodeGroup>

Notice how we import `from langsmith.wrappers import wrap_openai` and use it to wrap the OpenAI client (`openai_client = wrap_openai(OpenAI())`).

What happens if you call it in the following way?

```python
rag("where did harrison work")
```

This will produce a trace of just the OpenAI call - it should look something like [this](https://smith.langchain.com/public/e7b7d256-10fe-4d49-a8d5-36ca8e5af0d2/r)

<img src="https://mintcdn.com/langchain-5e9cc07a/1RIJxfRpkszanJLL/langsmith/images/tracing-tutorial-openai.png?fit=max&auto=format&n=1RIJxfRpkszanJLL&q=85&s=8b3ad3b0d00851bce313311efa4e8bbb" alt="" width="1027" height="615" data-path="langsmith/images/tracing-tutorial-openai.png" srcset="https://mintcdn.com/langchain-5e9cc07a/1RIJxfRpkszanJLL/langsmith/images/tracing-tutorial-openai.png?w=280&fit=max&auto=format&n=1RIJxfRpkszanJLL&q=85&s=c4ee9e306124a884702a7c0f5685e279 280w, https://mintcdn.com/langchain-5e9cc07a/1RIJxfRpkszanJLL/langsmith/images/tracing-tutorial-openai.png?w=560&fit=max&auto=format&n=1RIJxfRpkszanJLL&q=85&s=995ebe3b7342ea797887a052f962919d 560w, https://mintcdn.com/langchain-5e9cc07a/1RIJxfRpkszanJLL/langsmith/images/tracing-tutorial-openai.png?w=840&fit=max&auto=format&n=1RIJxfRpkszanJLL&q=85&s=24e6e8b84336197d23ed294d4d37c842 840w, https://mintcdn.com/langchain-5e9cc07a/1RIJxfRpkszanJLL/langsmith/images/tracing-tutorial-openai.png?w=1100&fit=max&auto=format&n=1RIJxfRpkszanJLL&q=85&s=822b72e7b0ea10a96cc05eeeefad7b51 1100w, https://mintcdn.com/langchain-5e9cc07a/1RIJxfRpkszanJLL/langsmith/images/tracing-tutorial-openai.png?w=1650&fit=max&auto=format&n=1RIJxfRpkszanJLL&q=85&s=985061817d26e8f76b50d2638b34ecb7 1650w, https://mintcdn.com/langchain-5e9cc07a/1RIJxfRpkszanJLL/langsmith/images/tracing-tutorial-openai.png?w=2500&fit=max&auto=format&n=1RIJxfRpkszanJLL&q=85&s=bf5bb01fa39af440f985666c39809cc5 2500w" data-optimize="true" data-opv="2" />

### Trace the whole chain

Great - we've traced the LLM call. But it's often very informative to trace more than that. LangSmith is **built** for tracing the entire LLM pipeline - so let's do that! We can do this by modifying the code to now look something like this:

<CodeGroup>
  ```python Python
  from openai import OpenAI
  from langsmith import traceable
  from langsmith.wrappers import wrap_openai
  openai_client = wrap_openai(OpenAI())

  def retriever(query: str):
      results = ["Harrison worked at Kensho"]
      return results

  @traceable
  def rag(question):
      docs = retriever(question)
      system_message = """Answer the users question using only the provided information below:
          {docs}""".format(docs="\n".join(docs))

      return openai_client.chat.completions.create(
          messages=[
              {"role": "system", "content": system_message},
              {"role": "user", "content": question},
          ],
          model="gpt-4o-mini",
      )

  ```

  ```typescript TypeScript
  import { OpenAI } from "openai";
  import { traceable } from "langsmith/traceable";
  import { wrapOpenAI } from "langsmith/wrappers";
  const openAIClient = wrapOpenAI(new OpenAI());

  async function retriever(query: string) {
    return ["This is a document"];
  }

  const rag = traceable(async function rag(question: string) {
    const docs = await retriever(question);

    const systemMessage =
      "Answer the users question using only the provided information below:\n\n" +
      docs.join("\n");

    return await openAIClient.chat.completions.create({
      messages: [
        { role: "system", content: systemMessage },
        { role: "user", content: question },
      ],
      model: "gpt-4o-mini",
    });
  });
  ```

</CodeGroup>

Notice how we import `from langsmith import traceable` and use it decorate the overall function (`@traceable`).

What happens if you call it in the following way?

```python
rag("where did harrison work")
```

This will produce a trace of the entire RAG pipeline - it should look something like [this](https://smith.langchain.com/public/8cafba6a-1a6d-4a73-8565-483186f31c29/r)

<img src="https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-chain.png?fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=00afea1ffa117b90159d30a53aac5a7f" alt="" width="1016" height="635" data-path="langsmith/images/tracing-tutorial-chain.png" srcset="https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-chain.png?w=280&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=01eb0588af8534c636796b1ffc673a14 280w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-chain.png?w=560&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=38625d3b2d93cd41b344bc2610272ff4 560w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-chain.png?w=840&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=f713b97cfd693fec7ea51d85d06c1358 840w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-chain.png?w=1100&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=039262907891da16b2a13d69ce3650ac 1100w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-chain.png?w=1650&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=97e50a697c1ac249ca91a38c42beaaa9 1650w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-chain.png?w=2500&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=871e76f1794d7c3d0d7fc3bb875fd613 2500w" data-optimize="true" data-opv="2" />

## Beta Testing

The next stage of LLM application development is beta testing your application. This is when you release it to a few initial users. Having good observability set up here is crucial as often you don't know exactly how users will actually use your application, so this allows you get insights into how they do so. This also means that you probably want to make some changes to your tracing set up to better allow for that. This extends the observability you set up in the previous section

### Collecting Feedback

A huge part of having good observability during beta testing is collecting feedback. What feedback you collect is often application specific - but at the very least a simple thumbs up/down is a good start. After logging that feedback, you need to be able to easily associate it with the run that caused that. Luckily LangSmith makes it easy to do that.

First, you need to log the feedback from your app. An easy way to do this is to keep track of a run ID for each run, and then use that to log feedback. Keeping track of the run ID would look something like:

```python
import uuid
run_id = str(uuid.uuid4())
rag(
    "where did harrison work",
    langsmith_extra={"run_id": run_id}
)
```

Associating feedback with that run would look something like:

```python
from langsmith import Client
ls_client = Client()
ls_client.create_feedback(
    run_id,
    key="user-score",
    score=1.0,
)
```

Once the feedback is logged, you can then see it associated with each run by clicking into the `Metadata` tab when inspecting the run. It should look something like [this](https://smith.langchain.com/public/8cafba6a-1a6d-4a73-8565-483186f31c29/r)

<img src="https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-feedback.png?fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=cb81a556fe40895ebb29d4428d4c62d9" alt="" width="1025" height="345" data-path="langsmith/images/tracing-tutorial-feedback.png" srcset="https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-feedback.png?w=280&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=165c08ee4c4f96f9f3ebb6e8183dc539 280w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-feedback.png?w=560&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=f50e70bda816d314ac233430fe5703be 560w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-feedback.png?w=840&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=579ca04b25401fd98dbd1109e55f4a8c 840w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-feedback.png?w=1100&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=9763f2b2f5cbb347f796e2c1951102cf 1100w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-feedback.png?w=1650&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=8c84bd91d25dbb0514385aabf8b2dbc2 1650w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-feedback.png?w=2500&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=b9f44b64e395eb392e9a6a0348189e84 2500w" data-optimize="true" data-opv="2" />

You can also query for all runs with positive (or negative) feedback by using the filtering logic in the runs table. You can do this by creating a filter like the following:

<img src="https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-filtering.png?fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=57ebc19f2e5443c21353064c082971bc" alt="" width="940" height="496" data-path="langsmith/images/tracing-tutorial-filtering.png" srcset="https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-filtering.png?w=280&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=630d2ed8d85794026cbf07fcc186f791 280w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-filtering.png?w=560&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=9bc6f8a5464f3c0bbdcf172ecb3e1f67 560w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-filtering.png?w=840&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=9daf8b6d1ecbc23112dba100a77bc0a6 840w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-filtering.png?w=1100&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=fa18baf671267ec4a1bfce3cfdc1c789 1100w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-filtering.png?w=1650&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=b3184ab4bfe8361d1d52b4e63c054e58 1650w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-filtering.png?w=2500&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=2e1aeade5945fe20527a58c1966b5a10 2500w" data-optimize="true" data-opv="2" />

### Logging Metadata

It is also a good idea to start logging metadata. This allows you to start keep track of different attributes of your app. This is important in allowing you to know what version or variant of your app was used to produce a given result.

For this example, we will log the LLM used. Oftentimes you may be experimenting with different LLMs, so having that information as metadata can be useful for filtering. In order to do that, we can add it as such:

```python
from openai import OpenAI
from langsmith import traceable
from langsmith.wrappers import wrap_openai
openai_client = wrap_openai(OpenAI())

@traceable(run_type="retriever")
def retriever(query: str):
    results = ["Harrison worked at Kensho"]
    return results

@traceable(metadata={"llm": "gpt-4o-mini"})
def rag(question):
    docs = retriever(question)
    system_message = """Answer the users question using only the provided information below:
    {docs}""".format(docs='\n'.join(docs))
    return openai_client.chat.completions.create(messages = [
        {"role": "system", "content": system_message},
        {"role": "user", "content": question},
    ], model="gpt-4o-mini")
```

Notice we added `@traceable(metadata={"llm": "gpt-4o-mini"})` to the `rag` function.

Keeping track of metadata in this way assumes that it is known ahead of time. This is fine for LLM types, but less desirable for other types of information - like a User ID. In order to log information that, we can pass it in at run time with the run ID.

```python
import uuid
run_id = str(uuid.uuid4())
rag(
    "where did harrison work",
    langsmith_extra={"run_id": run_id, "metadata": {"user_id": "harrison"}}
)
```

Now that we've logged these two pieces of metadata, we should be able to see them both show up in the UI [here](https://smith.langchain.com/public/37adf7e5-97aa-42d0-9850-99c0199bddf6/r).

<img src="https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-metadata.png?fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=db49738eba3e0ce26514df3c9b72f87c" alt="" width="1016" height="337" data-path="langsmith/images/tracing-tutorial-metadata.png" srcset="https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-metadata.png?w=280&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=c9f46f9e36cc47a6b10cc37870e17ffc 280w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-metadata.png?w=560&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=dba6e396adec67b74df789cfd9cd2491 560w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-metadata.png?w=840&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=e31ff00027f6c5741935cec40d997697 840w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-metadata.png?w=1100&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=cf82f0eca41b0fb04ae181e38ae47ece 1100w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-metadata.png?w=1650&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=fd57501d821496d68d5921e3cb8ce457 1650w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-metadata.png?w=2500&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=568f6fb60e84333f677775817dbc79e8 2500w" data-optimize="true" data-opv="2" />

We can filter for these pieces of information by constructing a filter like the following:

<img src="https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-metadata-filtering.png?fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=3662dfc2d8fb2c274f622e3f67e14b34" alt="" width="932" height="436" data-path="langsmith/images/tracing-tutorial-metadata-filtering.png" srcset="https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-metadata-filtering.png?w=280&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=561f6c48361533d9ddcfc005136ff6c3 280w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-metadata-filtering.png?w=560&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=1ea92820bc977b16368e89d923a631f5 560w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-metadata-filtering.png?w=840&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=137d1faa53ec75e8aaecf3aa2da32378 840w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-metadata-filtering.png?w=1100&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=f9c7902430dbae7b10543bd9b747a5fc 1100w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-metadata-filtering.png?w=1650&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=1494db66f66fceba483829a249a44a31 1650w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-metadata-filtering.png?w=2500&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=06c2f159f5ce8bf601640a8484be187f 2500w" data-optimize="true" data-opv="2" />

## Production

Great - you've used this newfound observability to iterate quickly and gain confidence that your app is performing well. Time to ship it to production! What new observability do you need to add?

First of all, let's note that the same observability you've already added will keep on providing value in production. You will continue to be able to drill down into particular runs.

In production you likely have a LOT more traffic. So you don't really want to be stuck looking at datapoints one at a time. Luckily, LangSmith has a set of tools to help with observability in production.

### Monitoring

If you click on the `Monitor` tab in a project, you will see a series of monitoring charts. Here we track lots of LLM specific statistics - number of traces, feedback, time-to-first-token, etc. You can view these over time across a few different time bins.

<img src="https://mintcdn.com/langchain-5e9cc07a/1RIJxfRpkszanJLL/langsmith/images/tracing-tutorial-monitor.png?fit=max&auto=format&n=1RIJxfRpkszanJLL&q=85&s=74f49882d9e6323e2ed467b525b81b9a" alt="" width="946" height="746" data-path="langsmith/images/tracing-tutorial-monitor.png" srcset="https://mintcdn.com/langchain-5e9cc07a/1RIJxfRpkszanJLL/langsmith/images/tracing-tutorial-monitor.png?w=280&fit=max&auto=format&n=1RIJxfRpkszanJLL&q=85&s=d99a10225425733cc18b1da00c04ff27 280w, https://mintcdn.com/langchain-5e9cc07a/1RIJxfRpkszanJLL/langsmith/images/tracing-tutorial-monitor.png?w=560&fit=max&auto=format&n=1RIJxfRpkszanJLL&q=85&s=88a2737937bfa46e5d44f665a757fb68 560w, https://mintcdn.com/langchain-5e9cc07a/1RIJxfRpkszanJLL/langsmith/images/tracing-tutorial-monitor.png?w=840&fit=max&auto=format&n=1RIJxfRpkszanJLL&q=85&s=5825a3a92fc134fe8fb8f8f4a7b46e55 840w, https://mintcdn.com/langchain-5e9cc07a/1RIJxfRpkszanJLL/langsmith/images/tracing-tutorial-monitor.png?w=1100&fit=max&auto=format&n=1RIJxfRpkszanJLL&q=85&s=848482d02d40236a1911a9623c39a2f0 1100w, https://mintcdn.com/langchain-5e9cc07a/1RIJxfRpkszanJLL/langsmith/images/tracing-tutorial-monitor.png?w=1650&fit=max&auto=format&n=1RIJxfRpkszanJLL&q=85&s=278ba4c130e01f1042d49069093a7285 1650w, https://mintcdn.com/langchain-5e9cc07a/1RIJxfRpkszanJLL/langsmith/images/tracing-tutorial-monitor.png?w=2500&fit=max&auto=format&n=1RIJxfRpkszanJLL&q=85&s=dcef7cc8a6be73d02b2030f2bb9dc783 2500w" data-optimize="true" data-opv="2" />

### A/B Testing

<Note>
  Group-by functionality for A/B testing requires at least 2 different values to exist for a given metadata key.
</Note>

You can also use this tab to perform a version of A/B Testing. In the previous tutorial we starting tracking a few different metadata attributes - one of which was `llm`. We can group the monitoring charts by ANY metadata attribute, and instantly get grouped charts over time. This allows us to experiment with different LLMs (or prompts, or other) and track their performance over time.

In order to do this, we just need to click on the `Metadata` button at the top. This will give us a drop down of options to choose from to group by:

<img src="https://mintcdn.com/langchain-5e9cc07a/1RIJxfRpkszanJLL/langsmith/images/tracing-tutorial-monitor-metadata.png?fit=max&auto=format&n=1RIJxfRpkszanJLL&q=85&s=dc91e44dac01fcb3966c7b57b1f41d66" alt="" width="957" height="534" data-path="langsmith/images/tracing-tutorial-monitor-metadata.png" srcset="https://mintcdn.com/langchain-5e9cc07a/1RIJxfRpkszanJLL/langsmith/images/tracing-tutorial-monitor-metadata.png?w=280&fit=max&auto=format&n=1RIJxfRpkszanJLL&q=85&s=8ddc7be16e3b0f6e09e83af55fbe917f 280w, https://mintcdn.com/langchain-5e9cc07a/1RIJxfRpkszanJLL/langsmith/images/tracing-tutorial-monitor-metadata.png?w=560&fit=max&auto=format&n=1RIJxfRpkszanJLL&q=85&s=cbc8c4287707ff477695f12d9220c55f 560w, https://mintcdn.com/langchain-5e9cc07a/1RIJxfRpkszanJLL/langsmith/images/tracing-tutorial-monitor-metadata.png?w=840&fit=max&auto=format&n=1RIJxfRpkszanJLL&q=85&s=70345f5ed014329e07046681734f412f 840w, https://mintcdn.com/langchain-5e9cc07a/1RIJxfRpkszanJLL/langsmith/images/tracing-tutorial-monitor-metadata.png?w=1100&fit=max&auto=format&n=1RIJxfRpkszanJLL&q=85&s=73662cff14eebb9498e295834e6b8c86 1100w, https://mintcdn.com/langchain-5e9cc07a/1RIJxfRpkszanJLL/langsmith/images/tracing-tutorial-monitor-metadata.png?w=1650&fit=max&auto=format&n=1RIJxfRpkszanJLL&q=85&s=7a5e5124ffbc658a5a97d372f41b96c0 1650w, https://mintcdn.com/langchain-5e9cc07a/1RIJxfRpkszanJLL/langsmith/images/tracing-tutorial-monitor-metadata.png?w=2500&fit=max&auto=format&n=1RIJxfRpkszanJLL&q=85&s=24dcb9a46ea8684c2fedd0b3f136d8a0 2500w" data-optimize="true" data-opv="2" />

Once we select this, we will start to see charts grouped by this attribute:

<img src="https://mintcdn.com/langchain-5e9cc07a/1RIJxfRpkszanJLL/langsmith/images/tracing-tutorial-monitor-grouped.png?fit=max&auto=format&n=1RIJxfRpkszanJLL&q=85&s=a1bf8fb453d7721d85bca20fbd7cb431" alt="" width="973" height="621" data-path="langsmith/images/tracing-tutorial-monitor-grouped.png" srcset="https://mintcdn.com/langchain-5e9cc07a/1RIJxfRpkszanJLL/langsmith/images/tracing-tutorial-monitor-grouped.png?w=280&fit=max&auto=format&n=1RIJxfRpkszanJLL&q=85&s=896d99b5a7456e10d92aa58c8d3bb6d8 280w, https://mintcdn.com/langchain-5e9cc07a/1RIJxfRpkszanJLL/langsmith/images/tracing-tutorial-monitor-grouped.png?w=560&fit=max&auto=format&n=1RIJxfRpkszanJLL&q=85&s=6cc318a5f30ed0e8e11accf1d6f7428d 560w, https://mintcdn.com/langchain-5e9cc07a/1RIJxfRpkszanJLL/langsmith/images/tracing-tutorial-monitor-grouped.png?w=840&fit=max&auto=format&n=1RIJxfRpkszanJLL&q=85&s=892af43a1ce178ec34ed4124a7a0f5d4 840w, https://mintcdn.com/langchain-5e9cc07a/1RIJxfRpkszanJLL/langsmith/images/tracing-tutorial-monitor-grouped.png?w=1100&fit=max&auto=format&n=1RIJxfRpkszanJLL&q=85&s=7be53f1392b471c45b7d14febe0df6f9 1100w, https://mintcdn.com/langchain-5e9cc07a/1RIJxfRpkszanJLL/langsmith/images/tracing-tutorial-monitor-grouped.png?w=1650&fit=max&auto=format&n=1RIJxfRpkszanJLL&q=85&s=61d68a5703c7e69fe4c96df6a861ab37 1650w, https://mintcdn.com/langchain-5e9cc07a/1RIJxfRpkszanJLL/langsmith/images/tracing-tutorial-monitor-grouped.png?w=2500&fit=max&auto=format&n=1RIJxfRpkszanJLL&q=85&s=e0a3af90e154e85c45f3de1cb0a908d5 2500w" data-optimize="true" data-opv="2" />

### Drilldown

One of the awesome abilities that LangSmith provides is the ability to easily drilldown into datapoints that you identify as problematic while looking at monitoring charts. In order to do this, you can simply hover over a datapoint in the monitoring chart. When you do this, you will be able to click the datapoint. This will lead you back to the runs table with a filtered view:

<img src="https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-monitor-drilldown.png?fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=1ca02e0473f1fdfff102f2ccba371828" alt="" width="952" height="708" data-path="langsmith/images/tracing-tutorial-monitor-drilldown.png" srcset="https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-monitor-drilldown.png?w=280&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=ddf0256ff1e85656a8339e16a652480d 280w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-monitor-drilldown.png?w=560&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=0fe248ccc799c0cef9e661c861e81605 560w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-monitor-drilldown.png?w=840&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=4c3f95dd9e31e1884f569bbf736b852c 840w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-monitor-drilldown.png?w=1100&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=8ce416eec3bdc7b4289ba9fbedf6959a 1100w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-monitor-drilldown.png?w=1650&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=a2f93d8d48a5cf33f2f4b664c72644a7 1650w, https://mintcdn.com/langchain-5e9cc07a/ImHGLQW1HnQYwnJV/langsmith/images/tracing-tutorial-monitor-drilldown.png?w=2500&fit=max&auto=format&n=ImHGLQW1HnQYwnJV&q=85&s=506f485087e2e7ab91e7a53c44fd8205 2500w" data-optimize="true" data-opv="2" />

## Conclusion

In this tutorial you saw how to set up your LLM application with best-in-class observability. No matter what stage your application is in, you will still benefit from observability.

If you have more in-depth questions about observability, check out the [how-to section](/langsmith/observability-concepts) for guides on topics like testing, prompt management, and more.
