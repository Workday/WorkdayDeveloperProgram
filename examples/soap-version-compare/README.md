# SOAP version compare

## What it is

A small Python script that answers the question asked before every Workday release: "will anything we send over SOAP break if we move to the newer web-service version?". It downloads the WSDLs Workday publishes for two versions, lays every operation's request out as a flat list of element paths, and reports what was added, removed, retyped or made required between them. It is for anyone who owns an integration built on the Workday SOAP API.

It compares published schemas. It does not call a tenant and it does not test behaviour.

## What's inside

- `wws_compare.py` is the script. Standard library only, Python 3.10 or later.
- `sample-output-v46.2-to-v47.1.md` is a real report for thirteen services, produced by the script as it is here.
- `sent.example.json` shows the optional file that lists the element paths your own requests send.

## How to use it

Compare two versions for the default set of services and print the report:

```
python wws_compare.py 46.2 47.1
```

Choose the services and write the report to a file:

```
python wws_compare.py 46.2 47.1 --services Staffing Human_Resources --out report.md
```

Check your own requests. Give the script the element paths each request contains, and it tells you whether an element you send is gone, has a different type, or has gained a required sibling:

```
python wws_compare.py 46.2 47.1 --services Staffing Human_Resources Financial_Management --sent sent.example.json
```

```
## The requests you send

- **Change Job** (Staffing): nothing you send is affected (the request did change elsewhere)
- **Update Workday Account** (Human Resources): MUST CHANGE. sent and gone: Workday Account for Worker Data > Exempt from Delegated Authentication
- **Put Funding Source** (Financial Management): MUST CHANGE. must now send: Funding Source Data > Funding Source Status Reference
```

How to read the report:

- **Identical** means the two request schemas hold exactly the same paths, types and required flags.
- **Added / Removed** count every path; the "first addition" and "first removal" columns name the top of a branch, since its children add nothing.
- **Newly required** lists elements that are required all the way down from the request element. A required element inside an optional parent is only reported under `--sent`, when your request sends that parent.
- An element inside an `xsd:choice` is never counted as required by itself.

Downloaded WSDLs are kept in `~/.wws-compare` (change it with `--cache`), so a second run does not download again. The files are several megabytes and the host sometimes closes the connection mid-file; the script retries with a growing pause.

## Before you deploy

- **Service names**: `--services` takes the names as they appear in the WSDL address, with underscores: `Human_Resources`, `Resource_Management`, `Financial_Management`. A service that is not published for one of the two versions is reported as such and skipped.
- **Version numbers**: write them as Workday does, `46.2`, `47.1`. A version that does not exist gives "Not published", not an error.
- **Depth**: paths are followed seven levels below the request element (`MAX_DEPTH`). Raise it if your requests nest deeper; the report grows quickly.
- **Requests only**: responses are not compared. A field that disappears from a Get response will not show up here.
- **Your paths**: the paths in the `--sent` file are element names joined with `/`, starting below the request element, exactly as they appear in your SOAP body.
- **Tested how**: on 26 November 2026 the author ran the script for seventeen services between v46.2 and v47.1: 2,012 operations, 1,903 identical requests, 84 changed, 25 new operations, 3 removed, 1 with a newly required element (Put Funding Source). Four findings were then checked by searching the WSDL files directly (the funding source status element, the delegated authentication elements, the personnel action assignment type element, and the removed Retrieve Severance Worksheet operation). The download path was run against an empty cache, and a version that does not exist was confirmed to report "Not published". No request in the newer version was sent to a tenant.
