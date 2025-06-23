
> Token: LRnFpm0C5d81s1S1PuCNfQuVj3wSGbWgd%2BZJwrmZE1bbo8mEdr9p4t%2FZ8jMoldu0PosD3sJbNDuHO7OwDn%2FvxPwQv73AEehgp8Hjb0%2FB%2BAPYpQt%2Bcc55bA2Z2ye1VwaqDCZnmcBqpd4%3D

>This token is used as a query parameter
> Endpoints\
> All endpoints share the required header "token". A company specific
> token will be issued by Rentman support upon request.
>
> Default content type returned for all endpoints is JSON.
>
> All endpoints use the GET method.
>
> Propertyadvertising\
> Retrieves the complete list of properties to be advertised for the
> company.
>
> url:https://www.rentman.online/propertyadvertising.php
> Required Headers:\
> token: Unique company token provided by Rentman support\
> Optional Headers:\
> ACCEPT: set to "application/xml" to receive XML rather than JSON
> response propref: set to a known propref (e.g. "123") to limit
> response to that property
>
> noimage: set to "1" to remove image binary data from the response.
>
> rob: set to "rent" to limit response to lettings properties. set to
> "sale" to limit response to sales properties\
> featured: set to "1" to limit response to featured properties\
> onlyarea: set to "1" to limit response to postcodes and areas for each
> property.
>
> limit: set to a positive integer x to limit response to x properties.
>
> page: set to a positive integer (begins at 1). Used in conjunction
> with "limit" to offset the response by "limit" properties. Where
> "limit" is not set the default is 25.
>
> Propertymedia\
> Retrieves media (photos, floorplan, EPC certificate etc) by property
> or by filename 
>url: https://www.rentman.online/propertymedia.php
>
> Required Headers:\
> token: Unique company token provided by Rentman support One of
> either:\
> propref: Retrieves all associated media for a specific property OR\
> filename: Retrieves a specific piece of media
>
> Optional Headers:\
> ACCEPT: set to "application/base64" to receive the base64 encoded
> binary only rather than the JSON record (which includes caption and
> filename) -- use with filename query string only
>
> Schemas
>
> Propertyadvertising
>
> {\
> \"\$schema\": \"http://json-schema.org/draft-07/schema\",\
> \"\$id\": \"http://example.com/example.json\",\
> \"type\": \"array\",\
> \"title\": \"The root schema\",\
> \"description\": \"The root schema comprises the entire JSON
> document.\", \"default\": \[\],\
> \"examples\": \[\
> \[\
> {\
> \"propref\": \"2\",\
> \"displayaddress\": \"2 SS17 street, Horndon-on-the-hill\",\
> \"displayprice\": \"£30,007 pcm (Holiday Let: £45 pd) \",\
> \"rentmonth\": \"30007.00\",\
> \"rentorbuy\": \"1\",\
> \"number\": \"2\",\
> \"street\": \"SS17 street\",\
> \"address3\": \"Horndon-On-The-Hill \",\
> \"address4\": \"Stanford-Le-Hope \",\
> \"postcode\": \"SS17 8QE \",\
> \"area\": \"Horndon-on-the-hill \",\
> \"nearesttsation\": \" \",\
> \"TYPE\": \"Semi Detached House \",\
> \"nonres\": \"\\u0000\",\
> \"commercial\": \"\\u0000\",\
> \"beds\": \"4\",\
> \"singles\": \"1\",\
> \"doubles\": \"3\",\
> \"baths\": \"1\",
>
> \"receps\": \"1\",\
> \"furnished\": \"4\",\
> \"bullets\": \"Semi Detached House\\r4 Beds\\r1 Reception\\r1
> Bathroom\\rEnergy Rating :B\\rCouncil Tax Band C\\rFurnished or\
> Unfurnished\\rshower\\rGarage\\rParking\\rLift\\rgarden\\r\",\
> \"FLOOR\": \"HSE \",\
> \"heating\": \"GCH\",\
> \"available\": \"2020-02-25\",\
> \"STATUS\": \"Under Offer\",\
> \"servicecharges\": \"\",\
> \"leaselength\": \"0\",\
> \"shortlet\": \"\\u0001\",\
> \"rating\": \"4\",\
> \"age\": \"Brand New \",\
> \"DESCRIPTION\": \"A hugely spacious, four bedroom Victorian
> semi-detached barely moments from the wild, wide open green space of
> Epping Forest.\",\
> \"comments\": \"A hugely spacious, four bedroom Victorian
> semi-detached barely moments from the wild, wide open green space of
> Epping Forest. With a private rear garden, twin WCs, cellar and
> massive amount of sociable space this is equally ideal for families or
> professional sharers, and is available
> immediately.\\r\\n\\r\\nRecently refurbished, Design & Decor is smart
> and stylish throughout.\",\
> \"strapline\": \"Large 4 Bedroom Detached House"\",\
> \"thoughts\": \"Nice clean property\",\
> \"floorplan\": \"D13FAB05-D361-4F0C-8EE2-4615BEF7F6DA.jpg \",\
> \"url\": \"www.dotgomm.co.uk \",\
> \"photo1\": \"B1FA163D-2CBD-4C34-AEC7-F6BDB24A814F.jpg\",\
> \"photo2\": \"51B06AC2-0868-43CA-836A-363D3E60E3F6.jpg\",\
> \"photo3\": \"BFDB9B5A-8E68-4C92-944F-7B9C60BD9E98.jpg\",\
> \"photo4\": \"6EEA89DB-3CB2-44DB-BE87-D467487E5F97.jpg\",\
> \"photo5\": \"38AB783A-1E3E-4110-8F2E-8CEEAD35BC80.jpg\",\
> \"photo6\": \"6BF60D96-CD93-4834-BE69-F3C40A17578C.jpg\",\
> \"photo7\": \"11052593-71C3-44C1-B1E0-5A65D02A2962.jpg\",\
> \"photo8\": \"4BB8EE16-8037-4397-8D26-13405031A59D.jpg\",\
> \"photo9\": \"33FDFD5E-BC3C-43B9-9D3D-2AB6380ECF72.jpg\",\
> \"photo1binary\": \"base64data\",\
> \"epc\": \"8F2645DF-0587-4AE4-883F-BE296B42AE72.jpg\",
>
> \"branch\": \"Branch 1"\",\
> \"branchtel\": \" \",\
> \"evt\": \"www.dotgomm.ca\",\
> \"featured\": \"\\u0000\",\
> \"brochure\": \" \",\
> \"geolocation\": \"51.543967752235,0.40509438094366\",
> \"negotiatorname\": \"Nigel Gomm \",\
> \"negotiatoremail\": \"nigel@dotgomm.co.uk \",\
> \"negotiatormobile\": \" \"\
> },\
> {\
> \"propref\": \"2\",\
> \"displayaddress\": \"2 SS17 street, Horndon-on-the-hill \",
> \"displayprice\": \"£30,007 pcm (Holiday Let: £45 pd) \",
> \"rentmonth\": \"30007.00\",\
> \"rentorbuy\": \"1\",\
> \"number\": \"2\",\
> \"street\": \"SS17 street\",\
> \"address3\": \"Horndon-On-The-Hill \",\
> \"address4\": \"Stanford-Le-Hope \",\
> \"postcode\": \"SS17 8QE \",\
> \"area\": \"Horndon-on-the-hill \",\
> \"nearesttsation\": \" \",\
> \"TYPE\": \"Semi Detached House \",\
> \"nonres\": \"\\u0000\",\
> \"commercial\": \"\\u0000\",\
> \"beds\": \"4\",\
> \"singles\": \"1\",\
> \"doubles\": \"3\",\
> \"baths\": \"1\",\
> \"receps\": \"1\",\
> \"furnished\": \"4\",

  -----------------------------------------------------------------------
  \\                \\                \\                \\
  ----------------- ----------------- ----------------- -----------------

  -----------------------------------------------------------------------

> \"bullets\": \"Semi Detached House\\r4 Beds\\r1 Reception\\r1
> Bathroom\\rEnergy Rating : B\\rCouncil Tax Band C\\rFurnished or\
> Unfurnished\\rshower\\rGarage\\rParking\\rLift\\rgarden\\r\",\
> \"FLOOR\": \"HSE \",\
> \"heating\": \"GCH\",\
> \"available\": \"2020-02-25\",\
> \"STATUS\": \"Under Offer\",\
> \"servicecharges\": \" \",\
> \"leaselength\": \"0\",\
> \"shortlet\": \"\\u0001\",\
> \"rating\": \"4\",\
> \"age\": \"Brand New \",\
> \"DESCRIPTION\": \"A hugely spacious, four bedroom Victorian
> semi-detached barely moments from the wild, wide open green space of
> Epping Forest.\",\
> \"comments\": \"A hugely spacious, four bedroom Victorian
> semi-detached barely moments from the wild, wide open green space of
> Epping Forest. With a private rear garden, twin WCs, cellar and
> massive amount of sociable space this is equally ideal for families or
> professional sharers, and is available
> immediately.\\r\\n\\r\\nRecently refurbished, Design & Decor is smart
> and stylish throughout.\",\
> \"strapline\": \"Large 4 Bedroom Detached House\",\
> \"thoughts\": \"Nice clean property\",\
> \"floorplan\": \"D13FAB05-D361-4F0C-8EE2-4615BEF7F6DA.jpg \",\
> \"url\": \"www.dotgomm.co.uk \",\
> \"photo1\": \"B1FA163D-2CBD-4C34-AEC7-F6BDB24A814F.jpg\",\
> \"photo2\": \"51B06AC2-0868-43CA-836A-363D3E60E3F6.jpg\",\
> \"photo3\": \"BFDB9B5A-8E68-4C92-944F-7B9C60BD9E98.jpg\",\
> \"photo4\": \"6EEA89DB-3CB2-44DB-BE87-D467487E5F97.jpg\",\
> \"photo5\": \"38AB783A-1E3E-4110-8F2E-8CEEAD35BC80.jpg\",\
> \"photo6\": \"6BF60D96-CD93-4834-BE69-F3C40A17578C.jpg\",\
> \"photo7\": \"11052593-71C3-44C1-B1E0-5A65D02A2962.jpg\",\
> \"photo8\": \"4BB8EE16-8037-4397-8D26-13405031A59D.jpg\",\
> \"photo9\": \"33FDFD5E-BC3C-43B9-9D3D-2AB6380ECF72.jpg\",\
> \"photo1binary\": \"base64...\",\
> \"epc\": \"8F2645DF-0587-4AE4-883F-BE296B42AE72.jpg\",\
> \"branch\": \"Branch 1 \",\
> \"branchtel\": \" \",
>
> \"evt\": \"www.dotgomm.ca\",\
> \"featured\": \"\\u0000\",\
> \"brochure\": \"\",\
> \"geolocation\": \"51.543967752235,0.40509438094366\",\
> \"negotiatorname\": \"Nigel Gomm\",\
> \"negotiatoremail\": \"nigel@dotgomm.co.uk\",\
> \"negotiatormobile\": \" \"\
> }\
> \]\
> \],\
> \"additionalItems\": true,\
> \"items\": {\
> \"\$id\": \"#/items\",\
> \"anyOf\": \[\
> {\
> \"\$id\": \"#/items/anyOf/0\",\
> \"type\": \"object\",\
> \"title\": \"The first anyOf schema\",\
> \"description\": \"An explanation about the purpose of this
> instance.\", \"default\": {},\
> \"examples\": \[\
> {\
> \"propref\": \"2\",\
> \"displayaddress\": \"2 SS17 street, Horndon-on-the-hill \",\
> \"displayprice\": \"£30,007 pcm (Holiday Let: £45 pd) \",\
> \"rentmonth\": \"30007.00\",\
> \"rentorbuy\": \"1\",\
> \"number\": \"2\",\
> \"street\": \"SS17 street\",\
> \"address3\": \"Horndon-On-The-Hill \",\
> \"address4\": \"Stanford-Le-Hope \",\
> \"postcode\": \"SS17 8QE \",\
> \"area\": \"Horndon-on-the-hill \",
>
> \"nearesttsation\": \" \",\
> \"TYPE\": \"Semi Detached House \",\
> \"nonres\": \"\\u0000\",\
> \"commercial\": \"\\u0000\",\
> \"beds\": \"4\",\
> \"singles\": \"1\",\
> \"doubles\": \"3\",\
> \"baths\": \"1\",\
> \"receps\": \"1\",\
> \"furnished\": \"4\",\
> \"bullets\": \"Semi Detached House\\r4 Beds\\r1 Reception\\r1
> Bathroom\\rEnergy Rating : B\\rCouncil Tax Band C\\rFurnished or\
> Unfurnished\\rshower\\rGarage\\rParking\\rLift\\rgarden\\r\",\
> \"FLOOR\": \"HSE \",\
> \"heating\": \"GCH\",\
> \"available\": \"2020-02-25\",\
> \"STATUS\": \"Under Offer\",\
> \"servicecharges\": \" \",\
> \"leaselength\": \"0\",\
> \"shortlet\": \"\\u0001\",\
> \"rating\": \"4\",\
> \"age\": \"Brand New \",\
> \"DESCRIPTION\": \"A hugely spacious, four bedroom Victorian
> semi-detached barely moments from the wild, wide open green space of
> Epping Forest.\",\
> \"comments\": \"A hugely spacious, four bedroom Victorian
> semi-detached barely moments from the wild, wide open green space of
> Epping Forest. With a private rear garden, twin WCs, cellar and
> massive amount of sociable space this is equally ideal for families or
> professional sharers, and is available
> immediately.\\r\\n\\r\\nRecently refurbished, Design & Decor is smart
> and stylish throughout.\",\
> \"strapline\": \"Large 4 Bedroom Detached House \",\
> \"thoughts\": \"Nice clean property\",\
> \"floorplan\": \"D13FAB05-D361-4F0C-8EE2-4615BEF7F6DA.jpg \",\
> \"url\": \"www.dotgomm.co.uk \",\
> \"photo1\": \"B1FA163D-2CBD-4C34-AEC7-F6BDB24A814F.jpg\",\
> \"photo2\": \"51B06AC2-0868-43CA-836A-363D3E60E3F6.jpg\",\
> \"photo3\": \"BFDB9B5A-8E68-4C92-944F-7B9C60BD9E98.jpg\",
>
> \"photo4\": \"6EEA89DB-3CB2-44DB-BE87-D467487E5F97.jpg\", \"photo5\":
> \"38AB783A-1E3E-4110-8F2E-8CEEAD35BC80.jpg\", \"photo6\":
> \"6BF60D96-CD93-4834-BE69-F3C40A17578C.jpg\", \"photo7\":
> \"11052593-71C3-44C1-B1E0-5A65D02A2962.jpg\", \"photo8\":
> \"4BB8EE16-8037-4397-8D26-13405031A59D.jpg\", \"photo9\":
> \"33FDFD5E-BC3C-43B9-9D3D-2AB6380ECF72.jpg\", \"photo1binary\":
> \"...base64data\",\
> \"epc\": \"8F2645DF-0587-4AE4-883F-BE296B42AE72.jpg\", \"branch\":
> \"Branch 1 \",\
> \"branchtel\": \" \",\
> \"evt\": \"www.dotgomm.ca \",\
> \"featured\": \"\\u0000\",\
> \"brochure\": \" \",\
> \"geolocation\": \"51.543967752235,0.40509438094366\",\
> \"negotiatorname\": \"Nigel Gomm \",\
> \"negotiatoremail\": \"nigel@dotgomm.co.uk\",\
> \"negotiatormobile\": \" \"\
> }\
> \],\
> \"required\": \[\
> \"propref\",\
> \"displayaddress\",\
> \"displayprice\",\
> \"rentmonth\",\
> \"rentorbuy\",\
> \"number\",\
> \"street\",\
> \"address3\",\
> \"address4\",\
> \"postcode\",\
> \"area\",\
> \"nearesttsation\",\
> \"TYPE\",
>
> \"nonres\",\
> \"commercial\",\
> \"beds\",\
> \"singles\",\
> \"doubles\",\
> \"baths\",\
> \"receps\",\
> \"furnished\",\
> \"bullets\",\
> \"FLOOR\",\
> \"heating\",\
> \"available\",\
> \"STATUS\",\
> \"servicecharges\",\
> \"leaselength\",\
> \"shortlet\",\
> \"rating\",\
> \"age\",\
> \"DESCRIPTION\",\
> \"comments\",\
> \"strapline\",\
> \"thoughts\",\
> \"floorplan\",\
> \"url\",\
> \"photo1\",\
> \"photo2\",\
> \"photo3\",\
> \"photo4\",\
> \"photo5\",\
> \"photo6\",\
> \"photo7\",\
> \"photo8\",\
> \"photo9\",
>
> \"photo1binary\",\
> \"epc\",\
> \"branch\",\
> \"branchtel\",\
> \"evt\",\
> \"featured\",\
> \"brochure\",\
> \"geolocation\",\
> \"negotiatorname\",\
> \"negotiatoremail\",\
> \"negotiatormobile\"\
> \],\
> \"properties\": {\
> \"propref\": {\
> \"\$id\": \"#/items/anyOf/0/properties/propref\",\
> \"type\": \"string\",\
> \"title\": \"The propref schema\",\
> \"description\": \"Unique property reference number.\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"2\"\
> \]\
> },\
> \"displayaddress\": {\
> \"\$id\": \"#/items/anyOf/0/properties/displayaddress\",\
> \"type\": \"string\",\
> \"title\": \"The displayaddress schema\",\
> \"description\": \"Address to be displayed for advertising purposes.
> Will not show street number and will show 'Area' rather than town or
> postcode \",\
> \"default\": \"\",\
> \"examples\": \[\
> \"2 SS17 street, Horndon-on-the-hill\"\
> \]
>
> },\
> \"displayprice\": {\
> \"\$id\": \"#/items/anyOf/0/properties/displayprice\",\
> \"type\": \"string\",\
> \"title\": \"The displayprice schema\",

+-----------------------------------+-----------------------------------+
| etc\",                            | > \"description\": \"Price to be  |
|                                   | > displayed. Will include         |
|                                   | > freehold/leasehold or rent      |
|                                   | > period                          |
+===================================+===================================+
+-----------------------------------+-----------------------------------+

> \"default\": \"\",\
> \"examples\": \[\
> \"£30,007 pcm (Holiday Let: £45 pd) \"\
> \]\
> },\
> \"rentmonth\": {\
> \"\$id\": \"#/items/anyOf/0/properties/rentmonth\",\
> \"type\": \"string\",\
> \"title\": \"The rentmonth schema\",\
> \"description\": \"Monthly rental. Use Displayprice as it will have
> addition information\", \"default\": \"\",\
> \"examples\": \[\
> \"30007.00\"\
> \]\
> },\
> \"rentorbuy\": {\
> \"\$id\": \"#/items/anyOf/0/properties/rentorbuy\",\
> \"type\": \"string\",\
> \"title\": \"The rentorbuy schema\",\
> \"description\": \"1 -- To Let, 2 -- For Sale, 3 -- To Let or For
> Sale.\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"1\"\
> \]\
> },\
> \"number\": {

+-------------+-------------+-------------+-------------+-------------+
| \$          | /           | /           | / /         | > /         |
+=============+=============+=============+=============+=============+
+-------------+-------------+-------------+-------------+-------------+

> \"\$id\": \"#/items/anyOf/0/properties/number\",\
> \"type\": \"string\",\
> \"title\": \"The number schema\",\
> \"description\": \"Street number (see displayaddress)\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"2\"\
> \]\
> },\
> \"street\": {\
> \"\$id\": \"#/items/anyOf/0/properties/street\",\
> \"type\": \"string\",\
> \"title\": \"The street schema\",\
> \"description\": \"Street. See displayaddress\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"SS17 street\"\
> \]\
> },\
> \"address3\": {\
> \"\$id\": \"#/items/anyOf/0/properties/address3\",\
> \"type\": \"string\",\
> \"title\": \"The address3 schema\",\
> \"description\": \"Address line 3. Usually the town. See
> Displayaddress \", \"default\": \"\",\
> \"examples\": \[\
> \"Horndon-On-The-Hill \"\
> \]\
> },\
> \"address4\": {\
> \"\$id\": \"#/items/anyOf/0/properties/address4\",\
> \"type\": \"string\",\
> \"title\": \"The address4 schema\",
>
> \"description\": \" Address line 4. Usually the county or city. See
> Displayaddress \", \"default\": \"\",\
> \"examples\": \[\
> \"Stanford-Le-Hope \"\
> \]\
> },\
> \"postcode\": {\
> \"\$id\": \"#/items/anyOf/0/properties/postcode\",\
> \"type\": \"string\",\
> \"title\": \"The postcode schema\",\
> \"description\": \"See displayaddress. Area will prove more useful for
> advertising than postcode.\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"SS17 8QE \"\
> \]\
> },\
> \"area\": {\
> \"\$id\": \"#/items/anyOf/0/properties/area\",\
> \"type\": \"string\",\
> \"title\": \"The area schema\",\
> \"description\": \"A user selected area that reflects better on the
> property than a simple postcode. E.g. Soho, YorkshireDales,
> Docklands.\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"Horndon-on-the-hill \"\
> \]\
> },\
> \"nearesttsation\": {\
> \"\$id\": \"#/items/anyOf/0/properties/nearesttsation\",\
> \"type\": \"string\",\
> \"title\": \"The nearesttsation schema\",\
> \"description\": \"Nearest Underground or overground railway
> station.\",\
> \"default\": \"\",
>
> \"examples\": \[\
> \" \"\
> \]\
> },\
> \"TYPE\": {\
> \"\$id\": \"#/items/anyOf/0/properties/TYPE\",\
> \"type\": \"string\",\
> \"title\": \"The TYPE schema\",\
> \"description\": \"User defined list of property types. Pre-defined
> examples are Conversion, SemiDetached, Flat, Maisonette.\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"Semi Detached House \"\
> \]\
> },\
> \"nonres\": {\
> \"\$id\": \"#/items/anyOf/0/properties/TYPE\",\
> \"type\": \"boolean\",\
> \"title\": \"The nonres schema\",\
> \"description\": \"Indicates if property is not residential (e.g.
> Garage). If true beds, double & single properties become
> unreliable\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"\\u0000\"\
> \]\
> },\
> \"commercial\": {\
> \"\$id\": \"#/items/anyOf/0/properties/TYPE\",\
> \"type\": \"boolean\",\
> \"title\": \"The commercial schema\",\
> \"description\": \"Indicates of property is commercial (e.g. shop). If
> true beds, double & singles properties become unreliable.\",\
> \"default\": \"\",\
> \"examples\": \[
>
> \\
>
> \"\\u0000 \"\
> \]\
> },\
> \"beds\": {\
> \"\$id\": \"#/items/anyOf/0/properties/beds\",\
> \"type\": \"string\",\
> \"title\": \"The beds schema\",\
> \"description\": \"total number of bedrooms.\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"4\"\
> \]\
> },\
> \"singles\": {\
> \"\$id\": \"#/items/anyOf/0/properties/singles\",\
> \"type\": \"string\",\
> \"title\": \"The singles schema\",\
> \"description\": \"number of singe bedrooms\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"1\"\
> \]\
> },\
> \"doubles\": {\
> \"\$id\": \"#/items/anyOf/0/properties/doubles\",\
> \"type\": \"string\",\
> \"title\": \"The doubles schema\",\
> \"description\": \"number of double bedrooms.\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"3\"\
> \]\
> },
>
> \"baths\": {\
> \"\$id\": \"#/items/anyOf/0/properties/baths\",\
> \"type\": \"string\",\
> \"title\": \"The baths schema\",\
> \"description\": \"Number of bathrooms.\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"1\"\
> \]\
> },\
> \"receps\": {\
> \"\$id\": \"#/items/anyOf/0/properties/receps\",\
> \"type\": \"string\",\
> \"title\": \"The receps schema\",\
> \"description\": \"number of reception rooms.\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"1\"\
> \]\
> },\
> \"furnished\": {\
> \"\$id\": \"#/items/anyOf/0/properties/furnished\",\
> \"type\": \"string\",\
> \"title\": \"The furnished schema\",\
> \"description\": \"1- Furnished, 2 -- Unfurnished, 3 - Part Furnished,
> 4- Available as either furnish or unfurnished\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"4\"\
> \]\
> },\
> \"bullets\": {\
> \"\$id\": \"#/items/anyOf/0/properties/bullets\",
>
> \"type\": \"string\",\
> \"title\": \"The bullets schema\",\
> \"description\": \"Features. Max 12 separated by ascii 13\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"Semi Detached House\\r4 Beds\\r1 Reception\\r1 Bathroom\\rEnergy
> Rating : B\\rCouncil Tax Band C\\rFurnished or\
> Unfurnished\\rshower\\rGarage\\rParking\\rLift\\rgarden\\r\"\
> \]\
> },\
> \"FLOOR\": {\
> \"\$id\": \"#/items/anyOf/0/properties/FLOOR\",\
> \"type\": \"string\",\
> \"title\": \"The FLOOR schema\",\
> \"description\": \"Free format indicating floor. E.g. 1, Top, LGF\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"HSE \"\
> \]\
> },\
> \"heating\": {\
> \"\$id\": \"#/items/anyOf/0/properties/heating\",\
> \"type\": \"string\",\
> \"title\": \"The heating schema\",\
> \"description\": \"Free format. \",\
> \"default\": \"\",\
> \"examples\": \[\
> \"GCH\"\
> \]\
> },\
> \"available\": {\
> \"\$id\": \"#/items/anyOf/0/properties/available\",\
> \"type\": \"string\",\
> \"title\": \"The available schema\",
>
> \"description\": \"Date property is available for move in\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"2020-02-25\"\
> \]\
> },\
> \"STATUS\": {\
> \"\$id\": \"#/items/anyOf/0/properties/STATUS\",\
> \"type\": \"string\",\
> \"title\": \"The STATUS schema\",\
> \"description\": \"Text indication property status. Available, For
> Sale, Under Offer.
>
> (available meaning To Let).\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"Under Offer\"\
> \]\
> },\
> \"servicecharges\": {\
> \"\$id\": \"#/items/anyOf/0/properties/servicecharges\",\
> \"type\": \"string\",\
> \"title\": \"The servicecharges schema\",\
> \"description\": \"Free format text.\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"\"\
> \]\
> },\
> \"leaselength\": {\
> \"\$id\": \"#/items/anyOf/0/properties/leaselength\",\
> \"type\": \"string\",\
> \"title\": \"The leaselength schema\",\
> \"description\": \"Leasehold/Freehold (sales properties only).\",
> \"default\": \"\",
>
> \"examples\": \[\
> \"0\"\
> \]\
> },\
> \"shortlet\": {\
> \"\$id\": \"#/items/anyOf/0/properties/shortlet\",\
> \"type\": \"string\",\
> \"title\": \"The shortlet schema\",\
> \"description\": \"Indicates if a property is available for short lets
> (less than 3 months).\", \"default\": \"\",\
> \"examples\": \[\
> \"\\u0001\"\
> \]\
> },\
> \"rating\": {\
> \"\$id\": \"#/items/anyOf/0/properties/rating\",\
> \"type\": \"string\",\
> \"title\": \"The rating schema\",\
> \"description\": \"1-5 indication general condition. 5 Being best.\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"4\"\
> \]\
> },\
> \"age\": {\
> \"\$id\": \"#/items/anyOf/0/properties/age\",\
> \"type\": \"string\",\
> \"title\": \"The age schema\",\
> \"description\": \"Free text indicating age of property.\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"Brand New \"\
> \]
>
> },\
> \"DESCRIPTION\": {\
> \"\$id\": \"#/items/anyOf/0/properties/DESCRIPTION\",\
> \"type\": \"string\",\
> \"title\": \"The DESCRIPTION schema\",\
> \"description\": \"A short description summary intended for search
> results page. Max 255 chars\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"A hugely spacious, four bedroom Victorian semi-detached barely
> moments from the wild, wide open green space of Epping Forest.\"\
> \]\
> },\
> \"comments\": {\
> \"\$id\": \"#/items/anyOf/0/properties/comments\",\
> \"type\": \"string\",\
> \"title\": \"The comments schema\",\
> \"description\": \" Free format blurb. A detailed explanation intended
> for a property details page.\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"A hugely spacious, four bedroom Victorian semi-detached barely
> moments from the wild, wide open green space of Epping Forest. With a
> private rear garden, twin WCs, cellar and massive amount of sociable
> space this is equally ideal for families or\
> professional sharers, and is available
> immediately.\\r\\n\\r\\nRecently refurbished, Design & Decor is smart
> and stylish throughout.\"\
> \]\
> },\
> \"strapline\": {\
> \"\$id\": \"#/items/anyOf/0/properties/strapline\",\
> \"type\": \"string\",\
> \"title\": \"The strapline schema\",\
> \"description\": \"Short caption for property.\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"Large 4 Bedroom Detached House\"
>
> \]\
> },\
> \"thoughts\": {\
> \"\$id\": \"#/items/anyOf/0/properties/thoughts\",\
> \"type\": \"string\",\
> \"title\": \"The thoughts schema\",\
> \"description\": \"Free format owner thoughts.\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"Nice clean property\"\
> \]\
> },\
> \"floorplan\": {\
> \"\$id\": \"#/items/anyOf/0/properties/floorplan\",\
> \"type\": \"string\",\
> \"title\": \"The floorplan schema\",\
> \"description\": \"filename of floorplan.\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"D13FAB05-D361-4F0C-8EE2-4615BEF7F6DA.jpg\"\
> \]\
> },\
> \"url\": {\
> \"\$id\": \"#/items/anyOf/0/properties/url\",\
> \"type\": \"string\",\
> \"title\": \"The url schema\",\
> \"description\": \"a link to an additional specific details page
> elsewhere.\", \"default\": \"\",\
> \"examples\": \[\
> \"www.dotgomm.co.uk\"\
> \]\
> },\
> \"photo1\": {

+-------------+-------------+-------------+-------------+-------------+
| \$          | /           | /           | / /         | > /         |
+=============+=============+=============+=============+=============+
+-------------+-------------+-------------+-------------+-------------+

> \"\$id\": \"#/items/anyOf/0/properties/photo1\",\
> \"type\": \"string\",\
> \"title\": \"The photo1 schema\",\
> \"description\": \"filename. See propertymedia endpoint\",
> \"default\": \"\",\
> \"examples\": \[\
> \"B1FA163D-2CBD-4C34-AEC7-F6BDB24A814F.jpg\" \]\
> },\
> \"photo2\": {\
> \"\$id\": \"#/items/anyOf/0/properties/photo2\",\
> \"type\": \"string\",\
> \"title\": \"The photo2 schema\",\
> \"description\": \" filename. See propertymedia endpoint \",
> \"default\": \"\",\
> \"examples\": \[\
> \"51B06AC2-0868-43CA-836A-363D3E60E3F6.jpg\"\
> \]\
> },\
> \"photo3\": {\
> \"\$id\": \"#/items/anyOf/0/properties/photo3\",\
> \"type\": \"string\",\
> \"title\": \"The photo3 schema\",\
> \"description\": \" filename. See propertymedia endpoint \",
> \"default\": \"\",\
> \"examples\": \[\
> \"BFDB9B5A-8E68-4C92-944F-7B9C60BD9E98.jpg\" \]\
> },\
> \"photo4\": {\
> \"\$id\": \"#/items/anyOf/0/properties/photo4\",\
> \"type\": \"string\",\
> \"title\": \"The photo4 schema\",fi
>
> \"description\": \" filename. See propertymedia endpoint.\",
> \"default\": \"\",\
> \"examples\": \[\
> \"6EEA89DB-3CB2-44DB-BE87-D467487E5F97.jpg\" \]\
> },\
> \"photo5\": {\
> \"\$id\": \"#/items/anyOf/0/properties/photo5\",\
> \"type\": \"string\",\
> \"title\": \"The photo5 schema\",\
> \"description\": \" filename. See propertymedia endpoint.\",
> \"default\": \"\",\
> \"examples\": \[\
> \"38AB783A-1E3E-4110-8F2E-8CEEAD35BC80.jpg\"\
> \]\
> },\
> \"photo6\": {\
> \"\$id\": \"#/items/anyOf/0/properties/photo6\",\
> \"type\": \"string\",\
> \"title\": \"The photo6 schema\",\
> \"description\": \" filename. See propertymedia endpoint.\",
> \"default\": \"\",\
> \"examples\": \[\
> \"6BF60D96-CD93-4834-BE69-F3C40A17578C.jpg\" \]\
> },\
> \"photo7\": {\
> \"\$id\": \"#/items/anyOf/0/properties/photo7\",\
> \"type\": \"string\",\
> \"title\": \"The photo7 schema\",\
> \"description\": \" filename. See propertymedia endpoint.\",
> \"default\": \"\",\
> \"examples\": \[
>
> \"11052593-71C3-44C1-B1E0-5A65D02A2962.jpg\"\
> \]\
> },\
> \"photo8\": {\
> \"\$id\": \"#/items/anyOf/0/properties/photo8\",\
> \"type\": \"string\",\
> \"title\": \"The photo8 schema\",\
> \"description\": \" filename. See propertymedia endpoint.\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"4BB8EE16-8037-4397-8D26-13405031A59D.jpg\"\
> \]\
> },\
> \"photo9\": {\
> \"\$id\": \"#/items/anyOf/0/properties/photo9\",\
> \"type\": \"string\",\
> \"title\": \"The photo9 schema\",\
> \"description\": \" filename. See propertymedia endpoint.\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"33FDFD5E-BC3C-43B9-9D3D-2AB6380ECF72.jpg\"\
> \]\
> },\
> \"photo1binary\": {\
> \"\$id\": \"#/items/anyOf/0/properties/photo1binary\",\
> \"type\": \"string\",\
> \"title\": \"The photo1binary schema\",\
> \"description\": \"base64 encode binary data of 1st filename. For
> binary of other photos see propertymedia endpoint..\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"base64....\"\
> \]
>
> },\
> \"epc\": {\
> \"\$id\": \"#/items/anyOf/0/properties/epc\",\
> \"type\": \"string\",\
> \"title\": \"The epc schema\",\
> \"description\": \"filename of EPC graph.\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"8F2645DF-0587-4AE4-883F-BE296B42AE72.jpg\"\
> \]\
> },\
> \"branch\": {\
> \"\$id\": \"#/items/anyOf/0/properties/branch\",\
> \"type\": \"string\",\
> \"title\": \"The branch schema\",\
> \"description\": \"company branch name for this property.\",
> \"default\": \"\",\
> \"examples\": \[\
> \"Branch 1\"\
> \]\
> },\
> \"branchtel\": {\
> \"\$id\": \"#/items/anyOf/0/properties/branchtel\",\
> \"type\": \"string\",\
> \"title\": \"The branchtel schema\",\
> \"description\": \"Telephone for the associated company branch.\",
> \"default\": \"\",\
> \"examples\": \[\
> \" \"\
> \]\
> },\
> \"evt\": {\
> \"\$id\": \"#/items/anyOf/0/properties/evt\",
>
> \"type\": \"string\",\
> \"title\": \"The evt schema\",\
> \"description\": \"A url linking to a virtual tour.\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"www.dotgomm.ca\"\
> \]\
> },\
> \"featured\": {\
> \"\$id\": \"#/items/anyOf/0/properties/featured\",\
> \"type\": \"string\",\
> \"title\": \"The featured schema\",\
> \"description\": \"Boolean indication this property to be featured on
> the homepage.\", \"default\": \"\",\
> \"examples\": \[\
> \"\\u0000\"\
> \]\
> },\
> \"brochure\": {\
> \"\$id\": \"#/items/anyOf/0/properties/brochure\",\
> \"type\": \"string\",\
> \"title\": \"The brochure schema\",\
> \"description\": \"filename of brochure\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"\"\
> \]\
> },\
> \"geolocation\": {\
> \"\$id\": \"#/items/anyOf/0/properties/geolocation\",\
> \"type\": \"string\",\
> \"title\": \"The geolocation schema\",\
> \"description\": \"latitude/longitude of the property.\",
>
> \"default\": \"\",\
> \"examples\": \[\
> \"51.543967752235,0.40509438094366\"\
> \]\
> },\
> \"negotiatorname\": {\
> \"\$id\": \"#/items/anyOf/0/properties/negotiatorname\",\
> \"type\": \"string\",\
> \"title\": \"The negotiatorname schema\",\
> \"description\": \"Specific negotiator dealing with this property.\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"Nigel Gomm \"\
> \]\
> },\
> \"negotiatoremail\": {\
> \"\$id\": \"#/items/anyOf/0/properties/negotiatoremail\",\
> \"type\": \"string\",\
> \"title\": \"The negotiatoremail schema\",\
> \"description\": \"Email of specific negotiator dealing with this
> property.\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"nigel@dotgomm.co.uk\"\
> \]\
> },\
> \"negotiatormobile\": {\
> \"\$id\": \"#/items/anyOf/0/properties/negotiatormobile\",\
> \"type\": \"string\",\
> \"title\": \"The negotiatormobile schema\",\
> \"description\": \" Mobile number of specific negotiator dealing with
> this property.\", \"default\": \"\",\
> \"examples\": \[\
> \" \"
>
> \]\
> }\
> },\
> \"additionalProperties\": true\
> }\
> \]\
> }\
> }\
> Propertymedia\
> {\
> \"\$schema\": \"http://json-schema.org/draft-07/schema\",\
> \"\$id\": \"http://example.com/example.json\",\
> \"type\": \"array\",\
> \"title\": \"The root schema\",\
> \"description\": \"The root schema comprises the entire JSON
> document.\", \"default\": \[\],\
> \"examples\": \[\
> \[\
> {\
> \"propref\": \"2\",\
> \"filename\": \"B1FA163D-2CBD-4C34-AEC7-F6BDB24A814F.jpg\",
> \"caption\": \"\",\
> \"base64data\": \"base64\...\",\
> \"imgorder\": \"9000\"\
> }\
> \]\
> \],\
> \"additionalItems\": true,\
> \"items\": {\
> \"\$id\": \"#/items\",\
> \"anyOf\": \[\
> {

+-----------------+-----------------+-----------------+-----------------+
| \$              | /               | /               | > /             |
+=================+=================+=================+=================+
+-----------------+-----------------+-----------------+-----------------+

> \"\$id\": \"#/items/anyOf/0\",\
> \"type\": \"object\",\
> \"title\": \"The first anyOf schema\",\
> \"description\": \"An explanation about the purpose of this
> instance.\", \"default\": {},\
> \"examples\": \[\
> {\
> \"propref\": \"2\",\
> \"filename\": \"B1FA163D-2CBD-4C34-AEC7-F6BDB24A814F.jpg\",
> \"caption\": \"\",\
> \"base64data\": \"base64\...\",\
> \"imgorder\": \"9000\"\
> }\
> \],\
> \"required\": \[\
> \"propref\",\
> \"filename\",\
> \"caption\",\
> \"base64data\",\
> \"imgorder\"\
> \],\
> \"properties\": {\
> \"propref\": {\
> \"\$id\": \"#/items/anyOf/0/properties/propref\",\
> \"type\": \"string\",\
> \"title\": \"The propref schema\",\
> \"description\": \"Unique property reference number.\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"2\"\
> \]\
> },\
> \"filename\": {

+-------------+-------------+-------------+-------------+-------------+
| \$          | /           | /           | / /         | > /fi       |
+=============+=============+=============+=============+=============+
+-------------+-------------+-------------+-------------+-------------+

> \"\$id\": \"#/items/anyOf/0/properties/filename\",\
> \"type\": \"string\",\
> \"title\": \"The filename schema\",\
> \"description\": \"filename.\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"B1FA163D-2CBD-4C34-AEC7-F6BDB24A814F.jpg\" \]\
> },\
> \"caption\": {\
> \"\$id\": \"#/items/anyOf/0/properties/caption\",\
> \"type\": \"string\",\
> \"title\": \"The caption schema\",\
> \"description\": \"A caption for the photo.\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"Bedroom 1\"\
> \]\
> },\
> \"base64data\": {\
> \"\$id\": \"#/items/anyOf/0/properties/base64data\", \"type\":
> \"string\",\
> \"title\": \"The base64data schema\",\
> \"description\": \"base64 encoded binary.\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"base64\...\"\
> \]\
> },\
> \"imgorder\": {\
> \"\$id\": \"#/items/anyOf/0/properties/imgorder\",\
> \"type\": \"string\",\
> \"title\": \"The imgorder schema\",
>
> \"description\": \"The order in which to display property photographs.
> 9000 = EPC, 9005 = floorplan, 9006 = brochure\",\
> \"default\": \"\",\
> \"examples\": \[\
> \"3\"\
> \]\
> }\
> },\
> \"additionalProperties\": true\
> }\
> \]\
> }\
> }
